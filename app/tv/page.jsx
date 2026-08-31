import '../globals.css';
import TvDashboard from '../../components/TvDashboard';
import { TOURNAMENT } from '../../lib/tournament-config.mjs';

export const metadata = {
  title: TOURNAMENT.tvTitle,
};

export default function TvPage() {
  return <TvDashboard />;
}
