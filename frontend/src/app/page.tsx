import Link from 'next/link';
import { getCategories } from '@/services/category.service';
import {
  getEntities,
  getTopRated,
} from '@/services/entity.service';
import FeedSection from '@/components/feed/FeedSection';
import WriteReviewPrompt from '@/components/reviews/WriteReviewPrompt';

export default async function Home() {
  const [
    categoriesResponse,
    entitiesResponse,
    topRatedResponse,
  ] = await Promise.all([
    getCategories(),
    getEntities(1, 10),

    // NEW:
    // Homepage load হওয়ার সময় Top Rated entities
    // backend থেকে automatically নিয়ে আসবে।
    getTopRated(),
  ]);

  return (
    <main className="min-h-screen p-8">
     

      <div className="mt-6">
   
      </div>
       <WriteReviewPrompt />
       <FeedSection />

    </main>
  );
}