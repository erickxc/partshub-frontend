import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Car, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

export function FipePage() {
  const [tipo, setTipo] = useState('carros');
  const [brand, setBrand] = useState<{ codigo: string; nome: string } | null>(null);
  const [model, setModel] = useState<{ codigo: string; nome: string } | null>(null);
  const [year, setYear] = useState<{ codigo: string; nome: string } | null>(null);
  const [brandSearch, setBrandSearch] = useState('');

  const { data: brands = [], isLoading: loadingBrands } = useQuery<any[]>({
    queryKey: ['fipe-brands', tipo],
    queryFn: () => api.get('/api/fipe/marcas', { params: { tipo } }).then((r) => r.data),
  });

  const { data: modelsData, isLoading: loadingModels } = useQuery<any>({
    queryKey: ['fipe-models', tipo, brand?.codigo],
    queryFn: () => api.get(`/api/fipe/marcas/${brand!.codigo}/modelos`, { params: { tipo } }).then((r) => r.data),
    enabled: !!brand,
  });

  const { data: years = [], isLoading: loadingYears } = useQuery<any[]>({
    queryKey: ['fipe-years', tipo, brand?.codigo, model?.codigo],
    queryFn: () => api.get(`/api/fipe/marcas/${brand!.codigo}/modelos/${model!.codigo}/anos`, { params: { tipo } }).then((r) => r.data),
    enabled: !!brand && !!model,
  });

  const { data: price, isLoading: loadingPrice } = useQuery<any>({
    queryKey: ['fipe-price', tipo, brand?.codigo, model?.codigo, year?.codigo],
    queryFn: () => api.get(`/api/fipe/marcas/${brand!.codigo}/modelos/${model!.codigo}/anos/${year!.codigo}/preco`, { params: { tipo } }).then((r) => r.data),
    enabled: !!brand && !!model && !!year,
  });

  const filteredBrands = brands.filter((b) => b.nome.toLowerCase().includes(brandSearch.toLowerCase()));
  const models = modelsData?.modelos ?? [];

  function reset(level: 'brand' | 'model' | 'year') {
    if (level === 'brand') { setBrand(null); setModel(null); setYear(null); }
    if (level === 'model') { setModel(null); setYear(null); }
    if (level === 'year') { setYear(null); }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tabela FIPE</h1>
          <p className="text-xs text-ph-soft mt-0.5">Consulta de preços de referência FIPE</p>
        </div>
        <div className="flex gap-1 bg-ph-surface-2 p-1 border border-ph-border" style={{ borderRadius: 4 }}>
          {[['carros', 'Carros'], ['motos', 'Motos'], ['caminhoes', 'Caminhões']].map(([v, l]) => (
            <button key={v} onClick={() => { setTipo(v); setBrand(null); setModel(null); setYear(null); }}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${tipo === v ? 'bg-ph-accent text-white' : 'text-ph-muted hover:text-ph-text'}`}
              style={{ borderRadius: 3 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-5">
          <button className={`font-semibold ${!brand ? 'text-ph-accent' : 'text-ph-soft hover:text-ph-text'}`} onClick={() => { setBrand(null); setModel(null); setYear(null); }}>Marcas</button>
          {brand && <><ChevronRight className="w-3 h-3 text-ph-soft" /><button className={`font-semibold ${!model ? 'text-ph-accent' : 'text-ph-soft hover:text-ph-text'}`} onClick={() => reset('model')}>{brand.nome}</button></>}
          {model && <><ChevronRight className="w-3 h-3 text-ph-soft" /><button className={`font-semibold ${!year ? 'text-ph-accent' : 'text-ph-soft hover:text-ph-text'}`} onClick={() => reset('year')}>{model.nome}</button></>}
          {year && <><ChevronRight className="w-3 h-3 text-ph-soft" /><span className="font-semibold text-ph-text">{year.nome}</span></>}
        </div>

        {/* Resultado FIPE */}
        {price && (
          <div className="card mb-5 max-w-md bg-white">
            <div className="px-5 py-4 border-b border-ph-border">
              <div className="text-xs font-semibold uppercase tracking-wider text-ph-soft mb-1">Preço de referência FIPE</div>
              <div className="text-3xl font-bold mono text-ph-accent">{price.Valor}</div>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="label block">Marca</span><span className="font-medium">{price.Marca}</span></div>
              <div><span className="label block">Modelo</span><span className="font-medium">{price.Modelo}</span></div>
              <div><span className="label block">Ano</span><span className="mono font-medium">{price.AnoModelo} — {price.Combustivel}</span></div>
              <div><span className="label block">Código FIPE</span><span className="mono font-medium">{price.CodigoFipe}</span></div>
              <div><span className="label block">Mês referência</span><span className="font-medium">{price.MesReferencia}</span></div>
            </div>
          </div>
        )}
        {loadingPrice && <div className="text-sm text-ph-soft mb-4">Buscando preço...</div>}

        {/* Brand list */}
        {!brand && (
          <div className="max-w-lg space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ph-soft" />
              <input className="input pl-9" placeholder="Filtrar marcas..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} />
            </div>
            {loadingBrands ? (
              <div className="text-sm text-ph-soft py-4 text-center">Carregando marcas...</div>
            ) : (
              <div className="card table-wrap">
                <table className="data-table">
                  <tbody>
                    {filteredBrands.map((b) => (
                      <tr key={b.codigo} className="cursor-pointer" onClick={() => { setBrand(b); setBrandSearch(''); }}>
                        <td className="font-semibold text-ph-text flex items-center gap-2"><Car className="w-3.5 h-3.5 text-ph-soft" />{b.nome}</td>
                        <td className="text-right"><ChevronRight className="w-3.5 h-3.5 text-ph-soft ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Model list */}
        {brand && !model && (
          <div className="max-w-lg card table-wrap">
            {loadingModels ? (
              <div className="text-sm text-ph-soft py-4 text-center">Carregando modelos...</div>
            ) : (
              <table className="data-table">
                <tbody>
                  {models.map((m: any) => (
                    <tr key={m.codigo} className="cursor-pointer" onClick={() => setModel(m)}>
                      <td className="font-medium text-ph-text">{m.nome}</td>
                      <td className="text-right"><ChevronRight className="w-3.5 h-3.5 text-ph-soft ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Year list */}
        {brand && model && !year && (
          <div className="max-w-lg card table-wrap">
            {loadingYears ? (
              <div className="text-sm text-ph-soft py-4 text-center">Carregando anos...</div>
            ) : (
              <table className="data-table">
                <tbody>
                  {years.map((y: any) => (
                    <tr key={y.codigo} className="cursor-pointer" onClick={() => setYear(y)}>
                      <td className="mono font-medium">{y.nome}</td>
                      <td className="text-right"><ChevronRight className="w-3.5 h-3.5 text-ph-soft ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
