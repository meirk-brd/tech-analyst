"use client";

import { MagicQuadrantChart, ForresterWaveChart, GigaOmRadarChart } from "@/components/charts";
import type { QuadrantDataPoint, WaveDataPoint, RadarDataPoint } from "@/lib/agents/visualization/chart-types";

// Sample data mimicking the Gartner reference image
const quadrantData: QuadrantDataPoint[] = [
  // Leaders (top-right)
  { company: "Microsoft", vision: 92, execution: 95, quadrant: "Leaders" },
  { company: "CrowdStrike", vision: 88, execution: 90, quadrant: "Leaders" },
  { company: "SentinelOne", vision: 85, execution: 82, quadrant: "Leaders" },
  { company: "Cybereason", vision: 82, execution: 78, quadrant: "Leaders" },
  { company: "Trend Micro", vision: 68, execution: 72, quadrant: "Leaders" },
  { company: "Sophos", vision: 70, execution: 70, quadrant: "Leaders" },

  // Challengers (top-left)
  { company: "ESET", vision: 25, execution: 55, quadrant: "Challengers" },

  // Visionaries (bottom-right)
  { company: "Cisco", vision: 62, execution: 48, quadrant: "Visionaries" },
  { company: "Palo Alto Networks", vision: 70, execution: 45, quadrant: "Visionaries" },
  { company: "Broadcom (Symantec)", vision: 65, execution: 42, quadrant: "Visionaries" },
  { company: "VMware", vision: 68, execution: 40, quadrant: "Visionaries" },
  { company: "Trellix", vision: 52, execution: 50, quadrant: "Visionaries" },

  // Niche Players (bottom-left)
  { company: "WithSecure", vision: 42, execution: 35, quadrant: "Niche Players" },
  { company: "Deep Instinct", vision: 35, execution: 32, quadrant: "Niche Players" },
  { company: "Bitdefender", vision: 48, execution: 30, quadrant: "Niche Players" },
  { company: "BlackBerry (Cylance)", vision: 38, execution: 28, quadrant: "Niche Players" },
  { company: "Fortinet", vision: 58, execution: 32, quadrant: "Niche Players" },
  { company: "Check Point", vision: 42, execution: 25, quadrant: "Niche Players" },
];

// Sample data mimicking the Forrester Wave reference image
const waveData: WaveDataPoint[] = [
  // Leaders (top-right area)
  { company: "Oracle", strategy: 95, currentOffering: 92, marketPresence: 95 },
  { company: "IBM", strategy: 85, currentOffering: 88, marketPresence: 80 },
  { company: "Google", strategy: 90, currentOffering: 85, marketPresence: 85 },
  { company: "Teradata", strategy: 82, currentOffering: 87, marketPresence: 70 },
  { company: "SAP", strategy: 85, currentOffering: 82, marketPresence: 75 },
  { company: "Databricks", strategy: 83, currentOffering: 78, marketPresence: 65 },
  { company: "Informatica", strategy: 88, currentOffering: 72, marketPresence: 55 },

  // Strong Performers (middle area)
  { company: "Microsoft", strategy: 65, currentOffering: 75, marketPresence: 90 },
  { company: "Snowflake", strategy: 68, currentOffering: 73, marketPresence: 60 },
  { company: "InterSystems", strategy: 65, currentOffering: 68, marketPresence: 45 },

  // Contenders
  { company: "OpenText", strategy: 55, currentOffering: 72, marketPresence: 50 },
  { company: "HPE", strategy: 58, currentOffering: 62, marketPresence: 55 },
  { company: "SAS", strategy: 55, currentOffering: 55, marketPresence: 60 },

  // Challengers
  { company: "Incorta", strategy: 35, currentOffering: 35, marketPresence: 25 },
];

// Sample data mimicking the GigaOm Radar reference image
const radarData: RadarDataPoint[] = [
  // Leaders (inner ring, closer to center)
  { company: "Qualys", angle: 45, radius: 75, tier: "Leader", movement: "outperformer", movementAngle: 45 },
  { company: "Rapid7", angle: 70, radius: 70, tier: "Leader", movement: "fast", movementAngle: 30 },

  // Challengers (middle ring)
  { company: "Cisco", angle: 340, radius: 50, tier: "Challenger", movement: "fast", movementAngle: 315 },
  { company: "Tenable", angle: 30, radius: 45, tier: "Challenger", movement: "fast", movementAngle: 45 },
  { company: "Breachlock", angle: 15, radius: 50, tier: "Challenger", movement: "fast", movementAngle: 30 },
  { company: "Intruder", angle: 320, radius: 45, tier: "Challenger", movement: "fast", movementAngle: 300 },
  { company: "Nucleus", angle: 280, radius: 60, tier: "Challenger", movement: "fast", movementAngle: 270 },

  // Entrants (outer ring)
  { company: "Vulcan Cyber", angle: 260, radius: 35, tier: "Entrant", movement: "forward", movementAngle: 60 },
  { company: "Brinqa", angle: 200, radius: 40, tier: "Entrant", movement: "fast", movementAngle: 30 },
  { company: "Aqua Security", angle: 160, radius: 35, tier: "Entrant", movement: "fast", movementAngle: 90 },
  { company: "Debricked", angle: 230, radius: 20, tier: "Entrant", movement: "forward", movementAngle: 45 },
];

export default function TestChartsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Chart Test Page</h1>

      <div className="space-y-12">
        {/* Magic Quadrant */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Magic Quadrant Chart</h2>
          <div className="bg-white rounded-lg p-4 inline-block">
            <MagicQuadrantChart
              data={quadrantData}
              title="Magic Quadrant for Endpoint Protection Platforms"
              dimensions={{ width: 800, height: 700 }}
            />
          </div>
        </section>

        {/* Forrester Wave */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Forrester Wave Chart</h2>
          <div className="bg-white rounded-lg p-4 inline-block">
            <ForresterWaveChart
              data={waveData}
              subtitle="Example"
              dimensions={{ width: 800, height: 650 }}
            />
          </div>
        </section>

        {/* GigaOm Radar */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">GigaOm Radar Chart</h2>
          <div className="bg-white rounded-lg p-4 inline-block">
            <GigaOmRadarChart
              data={radarData}
              category="Vulnerability Management"
              dimensions={{ width: 800, height: 700 }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
