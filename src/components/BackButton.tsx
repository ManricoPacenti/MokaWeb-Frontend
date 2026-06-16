import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  to: string;
  label?: string;
};

export default function BackButton({
  to,
  label = '← Back',
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm mb-3"
      onClick={() => navigate(to)}
    >
      {label}
    </button>
  );
}