'use client';

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import CopyableId from '@/components/common/CopyableId';
import PositionedImage from '@/components/media/PositionedImage';
import {
  EntityDetail,
  updateEntity,
} from '@/services/entity-management.service';
import { uploadImage } from '@/services/media.service';

// Header থেকে যা যা বদলাতে পারে — parent (dashboard) এগুলো নিজের state-এ মিলিয়ে নেয়
export type BusinessHeaderPatch = Partial<
  Pick<
    EntityDetail,
    | 'coverPhoto'
    | 'coverPositionY'
    | 'logo'
    | 'logoPositionX'
    | 'logoPositionY'
  >
>;

type BusinessHeaderProps = {
  entity: EntityDetail;
  reviewCount: number;
  onChange: (patch: BusinessHeaderPatch) => void;
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// Dashboard-এর উপরের header — cover photo ও profile picture (logo) বদলানো আর
// reposition করা যায়। প্রতিটা পরিবর্তন সাথে সাথে save হয়।
export default function BusinessHeader({
  entity,
  reviewCount,
  onChange,
}: BusinessHeaderProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [menu, setMenu] = useState<'cover' | 'logo' | null>(
    null,
  );

  // Cover
  const [coverY, setCoverY] = useState(
    entity.coverPositionY ?? 50,
  );
  const [coverRepositioning, setCoverRepositioning] =
    useState(false);

  // Logo
  const [logoPos, setLogoPos] = useState({
    x: entity.logoPositionX ?? 50,
    y: entity.logoPositionY ?? 50,
  });
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const [busy, setBusy] = useState<
    'cover-upload' | 'logo-upload' | 'saving' | null
  >(null);
  const [error, setError] = useState('');

  // বাইরে থেকে (যেমন Business info save-এর পর) ছবি/position বদলালে মিলিয়ে নেওয়া
  useEffect(() => {
    if (!coverRepositioning) {
      setCoverY(entity.coverPositionY ?? 50);
    }
  }, [entity.coverPositionY, entity.coverPhoto, coverRepositioning]);

  useEffect(() => {
    if (!logoModalOpen) {
      setLogoPos({
        x: entity.logoPositionX ?? 50,
        y: entity.logoPositionY ?? 50,
      });
    }
  }, [
    entity.logoPositionX,
    entity.logoPositionY,
    entity.logo,
    logoModalOpen,
  ]);

  // Menu-র বাইরে click করলে বন্ধ
  useEffect(() => {
    if (!menu) return;

    function onClick(e: MouseEvent) {
      if (
        !(e.target as HTMLElement).closest(
          '[data-header-menu]',
        )
      ) {
        setMenu(null);
      }
    }

    document.addEventListener('mousedown', onClick);

    return () =>
      document.removeEventListener('mousedown', onClick);
  }, [menu]);

  // Esc চাপলে logo reposition-এর dialog বন্ধ
  useEffect(() => {
    if (!logoModalOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancelLogo();
    }

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoModalOpen]);

  // ─────────── Cover ───────────
  async function handleCoverFile(
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setMenu(null);
    setError('');
    setBusy('cover-upload');

    try {
      const media = await uploadImage(
        file,
        'ENTITY_COVER',
        entity.id,
      );

      // নতুন ছবি — position আবার মাঝখান থেকে
      const response = await updateEntity(entity.id, {
        coverPhoto: media.url,
        coverPositionY: 50,
      });

      onChange({
        coverPhoto: response.data.coverPhoto,
        coverPositionY: response.data.coverPositionY ?? 50,
      });
    } catch (err) {
      setError(errorMessage(err, 'Could not change the cover photo'));
    } finally {
      setBusy(null);
    }
  }

  async function saveCover() {
    setBusy('saving');
    setError('');

    try {
      const y = Math.round(coverY * 10) / 10;

      const response = await updateEntity(entity.id, {
        coverPositionY: y,
      });

      onChange({
        coverPositionY: response.data.coverPositionY ?? y,
      });
      setCoverRepositioning(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save the position'));
    } finally {
      setBusy(null);
    }
  }

  function cancelCover() {
    setCoverY(entity.coverPositionY ?? 50);
    setCoverRepositioning(false);
    setError('');
  }

  // ─────────── Logo (profile picture) ───────────
  async function handleLogoFile(
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setMenu(null);
    setError('');
    setBusy('logo-upload');

    try {
      const media = await uploadImage(
        file,
        'ENTITY_LOGO',
        entity.id,
      );

      const response = await updateEntity(entity.id, {
        logo: media.url,
        logoPositionX: 50,
        logoPositionY: 50,
      });

      onChange({
        logo: response.data.logo,
        logoPositionX: response.data.logoPositionX ?? 50,
        logoPositionY: response.data.logoPositionY ?? 50,
      });
    } catch (err) {
      setError(errorMessage(err, 'Could not change the profile picture'));
    } finally {
      setBusy(null);
    }
  }

  async function saveLogo() {
    setBusy('saving');
    setError('');

    try {
      const x = Math.round(logoPos.x * 10) / 10;
      const y = Math.round(logoPos.y * 10) / 10;

      const response = await updateEntity(entity.id, {
        logoPositionX: x,
        logoPositionY: y,
      });

      onChange({
        logoPositionX: response.data.logoPositionX ?? x,
        logoPositionY: response.data.logoPositionY ?? y,
      });
      setLogoModalOpen(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save the position'));
    } finally {
      setBusy(null);
    }
  }

  function cancelLogo() {
    setLogoPos({
      x: entity.logoPositionX ?? 50,
      y: entity.logoPositionY ?? 50,
    });
    setLogoModalOpen(false);
    setError('');
  }

  const menuItemClass =
    'block w-full px-4 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/5';

  const menuPanelClass =
    'absolute z-40 mt-2 w-52 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-1 ring-black/5';

  const reviewsLabel =
    reviewCount > 0
      ? `${entity.averageRating.toFixed(1)} ★ · ${reviewCount} ${
          reviewCount === 1 ? 'review' : 'reviews'
        }`
      : 'No reviews yet';

  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <section className="relative flex min-h-[16rem] flex-col justify-end rounded-3xl bg-gradient-to-br from-[#3a3a3c] to-[#1c1c1e] sm:min-h-[19rem]">
        {/* ───── Cover ───── */}
        {entity.coverPhoto && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <PositionedImage
              src={entity.coverPhoto}
              alt={`${entity.name} cover`}
              y={coverY}
              axis="y"
              draggable={coverRepositioning}
              onChange={(p) => setCoverY(p.y)}
            />
          </div>
        )}

        {/* লেখা পরিষ্কার পড়ার জন্য নিচ থেকে কালো shade */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-300 ${
            coverRepositioning ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* ───── Business ID (উপরে বামে) ───── */}
        {entity.publicId && !coverRepositioning && (
          <div className="absolute left-3 top-3 z-20 rounded-2xl bg-black/65 px-3 py-2 text-white ring-1 ring-white/10 backdrop-blur-md sm:left-5 sm:top-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">
              Business ID
            </p>

            <CopyableId
              value={entity.publicId}
              className="mt-0.5 text-xs text-white"
              buttonClassName="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white transition hover:bg-white/25"
            />
          </div>
        )}

        {/* ───── Cover controls (উপরে ডানে) ───── */}
        <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
          {coverRepositioning ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveCover}
                disabled={busy === 'saving'}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {busy === 'saving' ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={cancelCover}
                disabled={busy === 'saving'}
                className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-md disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="relative" data-header-menu>
              <button
                type="button"
                onClick={() =>
                  setMenu(menu === 'cover' ? null : 'cover')
                }
                disabled={busy === 'cover-upload'}
                aria-haspopup="menu"
                aria-expanded={menu === 'cover'}
                className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/75 disabled:opacity-60 sm:px-4"
              >
                <span aria-hidden="true">📷</span>
                <span className="hidden sm:inline">
                  {busy === 'cover-upload'
                    ? 'Uploading...'
                    : 'Edit cover'}
                </span>
              </button>

              {menu === 'cover' && (
                <div role="menu" className={`${menuPanelClass} right-0`}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => coverInputRef.current?.click()}
                    className={menuItemClass}
                  >
                    Change cover photo
                  </button>

                  {entity.coverPhoto && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        setCoverRepositioning(true);
                      }}
                      className={menuItemClass}
                    >
                      Reposition
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFile}
            className="hidden"
          />
        </div>

        {coverRepositioning && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
            <span className="rounded-full bg-black/65 px-4 py-2 text-sm text-white backdrop-blur-md">
              Drag the photo to reposition
            </span>
          </div>
        )}

        {busy === 'cover-upload' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/40 text-sm font-medium text-white">
            Uploading cover...
          </div>
        )}

        {/* ───── Logo + নাম ───── */}
        <div
          className={`relative z-10 flex items-end gap-4 p-5 pt-24 text-white transition-opacity duration-300 sm:p-8 ${
            coverRepositioning
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
          }`}
        >
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-white/80 bg-gray-200 shadow-lg">
              {entity.logo ? (
                <PositionedImage
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  x={logoPos.x}
                  y={logoPos.y}
                />
              ) : (
                <span className="text-3xl font-bold text-gray-500">
                  {entity.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {busy === 'logo-upload' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-xs font-medium">
                ...
              </div>
            )}

            <div data-header-menu>
              <button
                type="button"
                onClick={() =>
                  setMenu(menu === 'logo' ? null : 'logo')
                }
                disabled={busy === 'logo-upload'}
                aria-haspopup="menu"
                aria-expanded={menu === 'logo'}
                aria-label="Edit profile picture"
                className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-black shadow-md ring-1 ring-black/10 transition hover:bg-gray-100 disabled:opacity-60"
              >
                📷
              </button>

              {menu === 'logo' && (
                <div
                  role="menu"
                  className={`${menuPanelClass} left-0 top-full`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => logoInputRef.current?.click()}
                    className={menuItemClass}
                  >
                    Change profile picture
                  </button>

                  {entity.logo && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        setLogoModalOpen(true);
                      }}
                      className={menuItemClass}
                    >
                      Reposition
                    </button>
                  )}
                </div>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              className="hidden"
            />
          </div>

          <div className="min-w-0 pb-1">
            <p className="truncate text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
              {entity.name}
            </p>

            <p className="mt-1 text-sm font-medium text-white/85 sm:text-[15px]">
              {entity.category?.name
                ? `${entity.category.name} · `
                : ''}
              {reviewsLabel}
            </p>
          </div>
        </div>

        {error && (
          <p className="absolute inset-x-4 top-16 z-30 rounded-2xl bg-[#ff3b30] px-4 py-2 text-center text-sm text-white shadow-lg sm:top-20">
            {error}
          </p>
        )}
      </section>

      {/* ───── Profile picture reposition dialog ───── */}
      {logoModalOpen && entity.logo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reposition profile picture"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-[#1d1d1f] shadow-2xl">
            <h3 className="text-lg font-semibold">
              Reposition profile picture
            </h3>
            <p className="mt-1 text-sm text-[#6e6e73]">
              Drag the photo to choose which part shows.
            </p>

            <div className="mx-auto mt-5 h-56 w-56 overflow-hidden rounded-3xl bg-[#f5f5f7] ring-1 ring-black/10">
              <PositionedImage
                src={entity.logo}
                alt={`${entity.name} logo`}
                x={logoPos.x}
                y={logoPos.y}
                axis="both"
                draggable
                onChange={setLogoPos}
              />
            </div>

            {error && (
              <p className="mt-4 text-center text-sm text-[#d70015]">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelLogo}
                disabled={busy === 'saving'}
                className="flex-1 rounded-full bg-[#f5f5f7] py-2.5 text-[15px] font-medium text-[#1d1d1f] transition hover:bg-[#ececf0] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveLogo}
                disabled={busy === 'saving'}
                className="flex-1 rounded-full bg-[#0071e3] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50"
              >
                {busy === 'saving' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}