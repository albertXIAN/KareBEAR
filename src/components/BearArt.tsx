import React, { useState } from 'react';
import { BearMoodInfo, THEME } from '../utils/careStoreLogic.ts';
import { useCareStore } from '../context/CareStoreContext.tsx';
import { Pencil, Check, X } from 'lucide-react';

interface BearBadgeProps {
  size?: number;
  mood?: BearMoodInfo;
  showsStatus?: boolean;
  speaking?: boolean;
  variant?: 'sit' | 'checklist' | 'doctor';
}

export const BearBadge: React.FC<BearBadgeProps> = ({
  size = 112,
  mood,
  showsStatus = false,
  speaking = false,
  variant = 'sit',
}) => {
  const store = useCareStore();
  const activeMood = mood ?? store.bearMood;

  const bgColor = showsStatus ? activeMood.soft : THEME.cream;
  const strokeColor = showsStatus ? activeMood.color : '#FFFFFF';
  const strokeWidth = Math.max(3, Math.round(size * 0.045));
  const imgSrc =
    variant === 'doctor'
      ? '/assets/kare-doctor.png'
      : variant === 'checklist'
      ? '/assets/kare-checklist.png'
      : '/assets/kare-sit.png';

  const animClass =
    activeMood.key === 'bright'
      ? 'animate-bear-bright'
      : activeMood.key === 'steady'
      ? 'animate-bear-steady'
      : '';

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full select-none transition-transform duration-300"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        border: `${strokeWidth}px solid ${strokeColor}`,
        boxShadow: showsStatus
          ? `0 4px 14px ${activeMood.color}28`
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
      role="img"
      aria-label={
        speaking
          ? `${activeMood.title}. ${store.companionName} is speaking.`
          : activeMood.title
      }
    >
      <div
        className={`relative flex items-center justify-center ${animClass}`}
        style={{
          width: size * 0.84,
          height: size * 0.84,
          transform:
            activeMood.key === 'tired'
              ? 'rotate(5deg) translateY(3px)'
              : undefined,
        }}
      >
        <img
          src={imgSrc}
          alt={store.companionName}
          className="w-full h-full object-contain pointer-events-none"
        />
        {speaking && (
          <span
            className="absolute -bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-[#0E5A54] px-2 py-0.5 text-[10px] font-bold text-white shadow"
            aria-hidden="true"
          >
            Speaking…
          </span>
        )}
      </div>
    </div>
  );
};

export const EmmaAvatar: React.FC<{ size?: number }> = ({ size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Profile photo"
      className="rounded-full shrink-0"
    >
      <circle cx="18" cy="18" r="17" fill="#E7B89A" stroke="#EFEAE1" strokeWidth="2" />
      <circle cx="18" cy="15.8" r="15.5" fill="#6B4226" />
      <ellipse cx="18" cy="20.5" rx="11.5" ry="9.8" fill="#F6D3C2" />
      <rect x="3" y="27" width="30" height="11" rx="5.5" fill="#0E5A54" />
      <circle cx="14.5" cy="18.6" r="1.5" fill="#3E2C24" />
      <circle cx="21.5" cy="18.6" r="1.5" fill="#3E2C24" />
      <rect x="15.5" y="22.5" width="5" height="2" rx="1" fill="#E07A7A" />
    </svg>
  );
};

export const NameBearButton: React.FC = () => {
  const store = useCareStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(store.companionName);

  const suggestions = ['Kare', 'Sunny', 'Pip', 'Honey', 'Mochi'];

  const handleOpen = () => {
    setDraft(store.companionName);
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.renameBear(draft);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0E5A54] border border-[#E8E2D8] shadow-2xs hover:bg-[#E6F4F1] transition cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Bear's name: {store.companionName}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="name-bear-title"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl bg-[#FAF6F0] p-6 border border-[#E8E2D8] shadow-xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <h3 id="name-bear-title" className="text-xl font-extrabold text-[#0E5A54]">
                Name your bear
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-[#556B68] hover:bg-white cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-[#556B68]">
              Pick a name for your recovery buddy. Every story and game will use this name.
            </p>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Kare"
              maxLength={18}
              className="w-full rounded-2xl bg-white px-4 py-3 text-base font-bold text-[#163835] border border-[#E8E2D8] focus:outline-none focus:ring-2 focus:ring-[#0E5A54]"
            />
            <div className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setDraft(name)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    draft === name
                      ? 'bg-[#0E5A54] text-white'
                      : 'bg-[#E6F4F1] text-[#0E5A54] hover:bg-[#BCE3DC]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl bg-white py-3 text-sm font-bold text-[#0E5A54] border border-[#E8E2D8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#0E5A54] py-3 text-sm font-bold text-white cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save name
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
