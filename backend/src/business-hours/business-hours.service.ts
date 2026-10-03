import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessHourDto } from './dto/business-hour.dto';

// "HH:mm" স্ট্রিং জিরো-প্যাডেড বলে lexicographic (string) তুলনাই
// chronological তুলনার সমান — আলাদা করে Date parse করার দরকার নেই।
const WEEKDAY_MAP = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

@Injectable()
export class BusinessHoursService {
  constructor(private prisma: PrismaService) {}

  // একটা দিনের জন্য একটাই row থাকে (schema-র @@unique([entityId,
  // dayOfWeek]) এটা enforce করে) — তাই upsert করলে conflict/duplicate
  // হওয়ার কোনো সুযোগই নেই। শুধু payload-এ যে day গুলো পাঠানো হয়েছে
  // সেগুলোই বদলায়, বাকি day অক্ষত থাকে।
  async setForEntity(entityId: string, hours: BusinessHourDto[]) {
    await this.prisma.$transaction(
      hours.map((hour) =>
        this.prisma.businessHour.upsert({
          where: {
            entityId_dayOfWeek: {
              entityId,
              dayOfWeek: hour.dayOfWeek,
            },
          },
          create: {
            entityId,
            dayOfWeek: hour.dayOfWeek,
            isClosed: hour.isClosed,
            openTime: hour.isClosed ? null : hour.openTime,
            closeTime: hour.isClosed ? null : hour.closeTime,
          },
          update: {
            isClosed: hour.isClosed,
            openTime: hour.isClosed ? null : hour.openTime,
            closeTime: hour.isClosed ? null : hour.closeTime,
          },
        }),
      ),
    );

    return this.findForEntity(entityId);
  }

  async findForEntity(entityId: string) {
    return this.prisma.businessHour.findMany({
      where: { entityId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  // Asia/Dhaka timezone-এ বর্তমান day + time বের করা — manual UTC
  // offset math না করে Intl ব্যবহার করছি, যাতে server যেই timezone-এই
  // থাকুক (Dhaka-তে হোক, বা deploy হওয়া কোনো cloud UTC সার্ভারে), ফলাফল
  // সবসময় Asia/Dhaka ভিত্তিক-ই আসবে।
  private getDhakaNow(): { dayOfWeek: number; time: string } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(new Date());

    const weekdayPart = parts.find(
      (p) => p.type === 'weekday',
    )!.value;
    const hourPart = parts.find(
      (p) => p.type === 'hour',
    )!.value;
    const minutePart = parts.find(
      (p) => p.type === 'minute',
    )!.value;

    const dayOfWeek = WEEKDAY_MAP.indexOf(
      weekdayPart as (typeof WEEKDAY_MAP)[number],
    );

    return {
      dayOfWeek,
      time: `${hourPart}:${minutePart}`,
    };
  }

  async isOpenNow(entityId: string): Promise<boolean> {
    const { dayOfWeek, time } = this.getDhakaNow();

    const today = await this.prisma.businessHour.findUnique({
      where: {
        entityId_dayOfWeek: { entityId, dayOfWeek },
      },
    });

    if (
      !today ||
      today.isClosed ||
      !today.openTime ||
      !today.closeTime
    ) {
      return false;
    }

    // সাধারণ দিনের hours (যেমন 09:00–22:00)
    if (today.closeTime > today.openTime) {
      return time >= today.openTime && time < today.closeTime;
    }

    // Overnight hours (যেমন 18:00–02:00) — আজকের open থেকে মধ্যরাত
    // পেরিয়ে পরদিনের closeTime পর্যন্ত চলবে
    return time >= today.openTime || time < today.closeTime;
  }
}