import { Trash2, X } from "lucide-react";

type ModalUser = {
  display_name: string | null;
  email: string | null;
};

type DeleteUserModalText = {
  tag: string;
  title: string;
  user: string;
  email: string;
  warningStart: string;
  warningEnd: string;
  confirmDelete: string;
  typeDeletePlaceholder: string;
  removing: string;
  removeUser: string;
};

type DeleteUserModalProps = {
  user: ModalUser;
  fallbackName: string;
  noEmailText: string;
  confirmText: string;
  actionLoading: boolean;
  t: DeleteUserModalText;
  onConfirmTextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function MiniBox({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: "white" | "gold";
}) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p
        className={`mt-1 truncate font-bold ${
          color === "gold" ? "text-yellow-300" : "text-white/75"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function DeleteUserModal({
  user,
  fallbackName,
  noEmailText,
  confirmText,
  actionLoading,
  t,
  onConfirmTextChange,
  onClose,
  onSubmit,
}: DeleteUserModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-400/25 bg-[#090909] p-6 shadow-[0_0_60px_rgba(239,68,68,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-300/80">{t.tag}</p>
            <h2 className="text-2xl font-black">{t.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-white/10 p-3 text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <MiniBox label={t.user} value={user.display_name || fallbackName} />

          <MiniBox
            label={t.email}
            value={user.email || noEmailText}
            color="gold"
          />
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/75">
          {t.warningStart}{" "}
          <span className="font-black text-red-200">DELETE</span>{" "}
          {t.warningEnd}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-white/80">
            {t.confirmDelete}
          </p>

          <input
            value={confirmText}
            onChange={(event) => onConfirmTextChange(event.target.value)}
            placeholder={t.typeDeletePlaceholder}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-red-400/50"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={actionLoading || confirmText !== "DELETE"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/20 px-5 py-4 font-black text-red-100 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
          {actionLoading ? t.removing : t.removeUser}
        </button>
      </div>
    </div>
  );
}