import { MapPin, Calendar, Clock, Trophy, AlertCircle, Users } from 'lucide-react';

const Rules = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Tournament Header */}
      <div className="mb-8 p-6 rounded-lg bg-gradient-to-br from-blue-950 to-neutral-900 border border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">MTCSV Badminton Tournament 2026</h1>
        </div>
        <p className="text-blue-200 text-sm">Mar Thoma Church of Silicon Valley · Yuvajana Sakhyam</p>
      </div>

      {/* Key Details */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Date & Time</h3>
          </div>
          <p className="text-neutral-300 text-sm">Saturday, April 25, 2026</p>
          <p className="text-neutral-300 text-sm">1:00 PM – 7:00 PM</p>
          <p className="text-neutral-400 text-xs mt-1">Check-in: 12:30 PM</p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Location</h3>
          </div>
          <p className="text-neutral-300 text-sm">Kerala House</p>
          <p className="text-neutral-400 text-xs">40374 Fremont Blvd</p>
          <p className="text-neutral-400 text-xs">Fremont, CA 94538</p>
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
            <div className="font-bold text-orange-300 mb-1">Preliminary Rounds</div>
            <div className="text-neutral-300">ONE set to <span className="font-bold text-white">15 points</span></div>
          </div>
          <div className="p-3 rounded bg-neutral-900/50 border border-neutral-800">
            <div className="font-bold text-orange-300 mb-1">Semi-Finals & Finals</div>
            <div className="text-neutral-300">THREE sets of <span className="font-bold text-white">21 points</span> each</div>
            <div className="text-neutral-400 text-xs mt-1">May change to 15 points if running out of time</div>
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
              <li>• MS, MD, MXD: <span className="text-white">4 groups</span> (A, B, C, D) → Top 1 from each advances to semi-finals</li>
              <li>• WS, WD: <span className="text-white">2 groups</span> (A, B) → Top 2 from each advances to semi-finals</li>
              <li>• Round robin within each group</li>
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
            <div className="font-bold text-blue-300 mb-2">Semi-Final Matchups</div>
            <ul className="space-y-1.5 text-neutral-300">
              <li>• Group A 1st place vs Group B 2nd place</li>
              <li>• Group B 1st place vs Group A 2nd place</li>
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
            • Teams/players <span className="text-white">late by more than 10 minutes</span> will forfeit and points awarded to opposition
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Committee provides <span className="text-white">1 birdie per set</span>; teams can bring extras if both agree
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
            • Your rackets (and extras if possible)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Non-marking shoes with proper grip (badminton shoes ideal)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Water and refreshments
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Foldable chairs (limited seating available)
          </li>
          <li className="p-3 rounded bg-neutral-900 border border-neutral-800">
            • Optional: Board games, chess, cards for casual play
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="p-5 rounded-lg bg-blue-950 border border-blue-800 text-center">
        <p className="text-blue-200 text-sm font-medium mb-1">
          "Serve for His Glory!"
        </p>
        <p className="text-blue-300 text-xs">
          Contact: Nishant George · 267-530-9577
        </p>
      </div>
    </div>
  );
};

export default Rules;
