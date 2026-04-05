'use client';

import { Agent, ModelOption } from '@/lib/types';
import { useMissionControlStore } from '@/lib/store';
import { modelOptions } from '@/lib/mockData';
import { ChevronDown } from 'lucide-react';

interface Props {
  agents: Agent[];
}

const modelMap = Object.fromEntries(modelOptions.map((m) => [m.id, m]));

export function AgentDeck({ agents }: Props) {
  const { selectedModelId, setSelectedModelId } = useMissionControlStore();
  const selectedModel = modelMap[selectedModelId] ?? modelOptions[0];

  return (
    <section className="card-shell">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-white/60">Agents</p>
          <h2 className="text-xl font-semibold">Active Threads</h2>
        </div>
        <div className="relative">
          <select
            className="bg-white/5 border border-white/15 rounded-full py-1.5 pl-4 pr-9 text-sm appearance-none"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
          >
            {modelOptions.map((option: ModelOption) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.provider}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => {
          const model = modelMap[agent.modelId];
          return (
            <article
              key={agent.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{agent.name}</h3>
                  <p className="text-sm text-white/60">{agent.role}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-white/70">
                  {agent.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white/70">
                <span className="px-2 py-1 rounded-full bg-white/10">{agent.channel}</span>
                {model && (
                  <span className="px-2 py-1 rounded-full bg-white/10">{model.label}</span>
                )}
                <span className="px-2 py-1 rounded-full bg-white/10">Uptime {agent.uptime}</span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {agent.tasks.map((task) => (
                  <span key={task} className="px-2 py-1 rounded bg-honey-400/20 text-honey-300">
                    {task}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <footer className="mt-4 text-xs text-white/50">
        Showing {agents.length} agents · Selected model: {selectedModel.label}
      </footer>
    </section>
  );
}
