'use client';

import { Package, Clock, Sparkles, Zap } from 'lucide-react';

export default function CatalogPage() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)] flex items-center justify-center cyber-breathe">
              <Package className="w-12 h-12 text-[#00FF41]" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#E0E0E8] mb-2">
          Catálogo Rápido
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-[#888899] mb-8">
          Uma nova forma de gerir os teus produtos está a chegar.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="cyber-panel p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#00FF41]" />
              </div>
              <p className="text-[10px] cyber-mono text-[#555566] text-center">
                Gestão de Produtos
              </p>
            </div>
          </div>

          <div className="cyber-panel p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00F0FF]" />
              </div>
              <p className="text-[10px] cyber-mono text-[#555566] text-center">
                Criação Rápida
              </p>
            </div>
          </div>

          <div className="cyber-panel p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFB800]" />
              </div>
              <p className="text-[10px] cyber-mono text-[#555566] text-center">
                Inventário em Tempo Real
              </p>
            </div>
          </div>

          <div className="cyber-panel p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[rgba(191,64,255,0.1)] border border-[rgba(191,64,255,0.2)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#BF40FF]" />
              </div>
              <p className="text-[10px] cyber-mono text-[#555566] text-center">
                Análises Avançadas
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.05)]">
          <Clock className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-xs cyber-mono text-[#00F0FF]">BREVE DISPONÍVEL</span>
        </div>

        {/* Additional Info */}
        <p className="text-[10px] text-[#444455] mt-6">
          Estamos a trabalhar para trazer-te uma experiência de gestão de catálogos
          <br />
          simples, rápida e poderosa.
        </p>
      </div>
    </div>
  );
}
