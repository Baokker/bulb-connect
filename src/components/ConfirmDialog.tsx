type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-btn dialog-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="dialog-btn dialog-btn-confirm"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
