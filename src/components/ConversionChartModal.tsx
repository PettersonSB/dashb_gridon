import { X } from "lucide-react";
import { SolarBudget } from "@/lib/types";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from "recharts";

interface ConversionChartModalProps {
    budgets: SolarBudget[];
    onClose: () => void;
}

export default function ConversionChartModal({ budgets, onClose }: ConversionChartModalProps) {
    // Process data by month (last 6 months)
    const processData = () => {
        const monthsData: Record<string, { totalResolvidos: number, aprovados: number, label: string }> = {};
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            monthsData[key] = { totalResolvidos: 0, aprovados: 0, label: label.charAt(0).toUpperCase() + label.slice(1) };
        }

        budgets.forEach(b => {
            if (b.status === 'aprovado' || b.status === 'recusado') {
                const d = new Date(b.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthsData[key]) {
                    monthsData[key].totalResolvidos++;
                    if (b.status === 'aprovado') {
                        monthsData[key].aprovados++;
                    }
                }
            }
        });

        return Object.values(monthsData).map(d => ({
            name: d.label,
            taxa: d.totalResolvidos > 0 ? Math.round((d.aprovados / d.totalResolvidos) * 100) : 0
        }));
    };

    const data = processData();

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-[hsl(228,25%,12%)] border border-white/[0.08] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Taxa de Conversão Mensal</h3>
                        <p className="text-xs text-white/40 mt-0.5">Evolução dos últimos 6 meses</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(228, 25%, 15%)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [`${Number(value)}%`, 'Conversão']}
                            />
                            <Area type="monotone" dataKey="taxa" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTaxa)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
