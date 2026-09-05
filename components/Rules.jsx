import { MapPin, Calendar, Clock, Trophy, AlertCircle, Users } from 'lucide-react';
import { TOURNAMENT } from '../lib/tournament-config.mjs';

const Rules = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Tournament Header */}
      <div className="mb-8 p-6 rounded-lg bg-gradient-to-br from-blue-950 to-neutral-900 border border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">{TOURNAMENT.fullTitle}</h1>
        </div>
        <p className="text-blue-200 text-sm">{TOURNAMENT.organizer}</p>
      </div>

      {/* Key Details */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Date & Time</h3>
          </div>
          <p className="text-neutral-300 text-sm">{TOURNAMENT.date}</p>
          <p className="text-neutral-300 text-sm">{TOURNAMENT.timeRange}</p>
          <p className="text-neutral-400 text-xs mt-1">{TOURNAMENT.checkIn}</p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Location</h3>
          </div>
          <p className="text-neutral-300 text-sm">{TOURNAMENT.venue.name}</p>
          <p className="text-neutral-400 text-xs">{TOURNAMENT.venue.address}</p>
        </div>
      </div>

      {/* Scoring Format */}
      <div className="mb-8 p-5 rounded-lg bg-gradient-to-br from-orange-950 to-neutral-900 border border-orange-800">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">Scoring Format</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded bg-neutral-900/50 border border-neutral-800">
            <div className="font-bold text-orange-300 mb-1">Men's Singles & Men's Doubles</div>
            <div className="text-neutral-300">Games to <span className="font-bold text-white">21 points</span> (maximum <span className="font-bold text-white">30</span>)</div>
          </div>
          <div className="p-3 rounded bg-neutral-900/50 border border-neutral-800">
            <div className="font-bold text-orange-300 mb-1">Women's Doubles & Mixed Doubles</div>
            <div className="text-neutral-300">Games to <span className="font-bold text-white">15 points</span> (maximum <span className="font-bold text-white">21</span>)</div>
          </div>
          <div className="p-3 rounded bg-neutral-900/50 border border-neutral-800">
            <div className="font-bold text-orange-300 mb-1">Sets</div>
            <div className="text-neutral-300">Prelims & Quarterfinals: <span className="font-bold text-white">ONE set</span> · Semis, Finals & 3rd Place: <span className="font-bold text-white">THREE sets</span></div>
          </div>
        </div>
      </div>

      {/* Tournament Format */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Tournament Format
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="font-bold text-blue-300 mb-2">Group Stage</div>
            <ul className="space-y-1.5 text-neutral-300">
              <li>• Men's Doubles: <span className="text-white">24 teams</span> in 4 groups</li>
              <li>• Men's Singles: <span className="text-white">16 players</span> in 4 groups</li>
              <li>• Mixed Doubles: <span className="text-white">10 teams</span> in 2 groups</li>
              <li>• Women's Doubles: <span className="text-white">9 teams</span> in 2 groups</li>
              <li>• Round robin within each group</li>
              <li>• <span className="text-white">Top 2</span> from each group advance to the next stage</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="font-bold text-blue-300 mb-2">Tie-Breaking Rules</div>
            <ul className="space-y-1.5 text-neutral-300">
              <li>• <span className="text-white">2-way tie:</span> Winner of head-to-head match ranks higher</li>
              <li>• <span className="text-white">3-way tie:</span> Ranked by point differential (points won - points lost)</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="font-bold text-blue-300 mb-2">Knockout Rounds</div>
            <ul className="space-y-1.5 text-neutral-300">
              <li>• MD & MS: Quarterfinals → Semifinals → Final</li>
              <li>• WD & MXD: Semifinals → Final</li>
              <li>• Group winners face runners-up from another group; group-mates can only meet again in the final</li>
            </ul>
          </div>
        </div>
      </div>

      {/* General Rules */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">General Rules</h2>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • All rules follow <span className="text-white">BWF guidelines</span>
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Minimum age for registration: <span className="text-white">13 years</span>
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Umpires have the <span className="text-white">final say</span> at any point in the match
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Teams/players <span className="text-white">late by more than 10 minutes</span> from the scheduled start forfeit; points awarded to the opposition (recorded 1–0)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Committee provides <span className="text-white">1 birdie per set</span>; teams can bring extras if both agree. Birdies for practice matches are not provided
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Registration requires membership of a <span className="text-white">Kerala-based church</span> (Bay Area or India)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • All Tournament Committee decisions are <span className="text-white">final</span>
          </li>
        </ul>
      </div>

      {/* What to Bring */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">What to Bring</h2>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Your rackets, plus extras — <span className="text-white">no rentals available</span> at the facility
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Good quality non-marking shoes with proper grip (badminton shoes ideal)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Water and refreshments for you and your kids — <span className="text-white">lunch will be served</span>
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Foldable chairs (limited bench seating at the center)
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="p-5 rounded-lg bg-blue-950 border border-blue-800 text-center">
        {TOURNAMENT.tagline && (
          <p className="text-blue-200 text-sm font-medium mb-1">
            "{TOURNAMENT.tagline}"
          </p>
        )}
        <p className="text-blue-300 text-xs">
          Contact: {TOURNAMENT.contact.name}{TOURNAMENT.contact.phone ? ` · ${TOURNAMENT.contact.phone}` : ''}
        </p>
      </div>
    </div>
  );
};

export default Rules;
