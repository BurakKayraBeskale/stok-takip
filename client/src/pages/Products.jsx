import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios.js';
import { exportToExcel } from '../utils/exportExcel.js';

const EMPTY_FORM = {
  sku: '', name: '', description: '',
  categoryId: '', supplierId: '',
  unitPrice: '', unit: '',
};

// Excel sütun adları → iç alan adları
const COL_MAP = {
  'SKU':          'sku',
  'Ürün Adı':     'name',
  'Kategori':     'categoryName',
  'Tedarikçi':    'supplierName',
  'Birim Fiyat':  'unitPrice',
  'Birim':        'unit',
  'Açıklama':     'description',
};

const REQUIRED_COLS = ['SKU', 'Ürün Adı', 'Kategori', 'Tedarikçi', 'Birim Fiyat', 'Birim'];

// ── Şablon oluşturur ve indirir ────────────────────────────────────────────
function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['SKU', 'Ürün Adı', 'Kategori', 'Tedarikçi', 'Birim Fiyat', 'Birim', 'Açıklama'],
    ['URN-001', 'Örnek Ürün', 'Elektronik', 'ABC Tedarik', 49.90, 'adet', 'İsteğe bağlı açıklama'],
  ]);
  // Sütun genişlikleri
  ws['!cols'] = [
    { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
  XLSX.writeFile(wb, 'urun_import_sablonu.xlsx');
}

// ── Excel dosyasını parse eder ─────────────────────────────────────────────
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const raw  = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (raw.length === 0) return reject(new Error('Dosya boş veya başlık satırı yok'));

        // Başlık kontrolü
        const headers = Object.keys(raw[0]);
        const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missing.length > 0)
          return reject(new Error(`Eksik sütunlar: ${missing.join(', ')}`));

        // Sütunları normalize et
        const rows = raw.map(r => {
          const obj = {};
          Object.entries(COL_MAP).forEach(([col, field]) => {
            obj[field] = r[col] ?? '';
          });
          return obj;
        });
        resolve(rows);
      } catch (err) {
        reject(new Error('Dosya okunamadı: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Import modalı ──────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }) {
  const fileRef  = useRef();
  const [rows,        setRows]        = useState(null);   // parse edilmiş satırlar
  const [parseError,  setParseError]  = useState('');
  const [importing,   setImporting]   = useState(false);
  const [result,      setResult]      = useState(null);   // { created, errors, total }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setParseError('');
    setRows(null);
    setResult(null);
    try {
      const parsed = await parseExcel(file);
      setRows(parsed);
    } catch (err) {
      setParseError(err.message);
      e.target.value = '';
    }
  }

  async function handleImport() {
    if (!rows?.length) return;
    setImporting(true);
    try {
      const { data } = await api.post('/products/import', { rows });
      setResult(data);
      if (data.created > 0) onImported(); // listeyi yenile
    } catch (err) {
      setParseError(err.response?.data?.error ?? 'İçe aktarma başarısız');
    } finally {
      setImporting(false);
    }
  }

  const PREVIEW_LIMIT = 8;
  const preview = rows?.slice(0, PREVIEW_LIMIT) ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 760,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 12px 48px rgba(0,0,0,.18)',
      }}>
        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Excel'den Ürün İçe Aktar</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Adım 1 — Şablon + dosya seç */}
        {!result && (
          <>
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '14px 16px', marginBottom: 18,
              fontSize: '0.85rem', color: '#475569', lineHeight: 1.7,
            }}>
              <strong>Kullanım:</strong> Önce şablonu indirin, doldurun, ardından yükleyin.<br />
              Kategori ve tedarikçi adları sistemdeki mevcut kayıtlarla <strong>tam eşleşmeli</strong>.<br />
              Dolu olmayan isteğe bağlı alan: <em>Açıklama</em>.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={downloadTemplate}>
                ↓ Şablonu İndir
              </button>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', borderRadius: 6,
                border: '1px solid #cbd5e1', cursor: 'pointer',
                fontSize: '0.875rem', background: '#fff', color: '#334155',
              }}>
                <span>📂</span>
                <span>{rows ? 'Farklı Dosya Seç' : 'Excel Dosyası Seç (.xlsx / .xls)'}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleFile}
                />
              </label>
            </div>

            {parseError && (
              <div className="alert-error" style={{ marginBottom: 16 }}>{parseError}</div>
            )}

            {/* Önizleme tablosu */}
            {rows && (
              <>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 8 }}>
                  Önizleme — {rows.length} satır okundu
                  {rows.length > PREVIEW_LIMIT && ` (ilk ${PREVIEW_LIMIT} gösteriliyor)`}
                </div>
                <div style={{ overflowX: 'auto', marginBottom: 18 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        {['SKU', 'Ürün Adı', 'Kategori', 'Tedarikçi', 'Birim Fiyat', 'Birim', 'Açıklama'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px' }}><code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: 3 }}>{r.sku}</code></td>
                          <td style={{ padding: '5px 10px' }}>{r.name}</td>
                          <td style={{ padding: '5px 10px' }}>{r.categoryName}</td>
                          <td style={{ padding: '5px 10px' }}>{r.supplierName}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right' }}>{r.unitPrice}</td>
                          <td style={{ padding: '5px 10px' }}>{r.unit}</td>
                          <td style={{ padding: '5px 10px', color: '#94a3b8' }}>{r.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={onClose}>İptal</button>
                  <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                    {importing ? 'Aktarılıyor…' : `${rows.length} Satırı İçe Aktar`}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Adım 2 — Sonuç */}
        {result && (
          <>
            <div style={{
              display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap',
            }}>
              <div style={{
                flex: 1, minWidth: 140, background: result.created > 0 ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${result.created > 0 ? '#86efac' : '#e2e8f0'}`,
                borderRadius: 8, padding: '14px 18px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: result.created > 0 ? '#16a34a' : '#94a3b8' }}>
                  {result.created}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>Ürün eklendi</div>
              </div>
              <div style={{
                flex: 1, minWidth: 140, background: result.errors.length > 0 ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${result.errors.length > 0 ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: 8, padding: '14px 18px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: result.errors.length > 0 ? '#dc2626' : '#94a3b8' }}>
                  {result.errors.length}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>Hatalı satır</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                  Hata Detayları
                </div>
                <div style={{
                  border: '1px solid #fee2e2', borderRadius: 6,
                  maxHeight: 240, overflowY: 'auto', marginBottom: 20,
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#fef2f2', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #fee2e2', width: 60 }}>Satır</th>
                        <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #fee2e2', width: 120 }}>SKU</th>
                        <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #fee2e2' }}>Hata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fef2f2' }}>
                          <td style={{ padding: '5px 12px', color: '#64748b' }}>{e.row}</td>
                          <td style={{ padding: '5px 12px' }}><code style={{ fontSize: '0.75rem', background: '#fef2f2', padding: '1px 5px', borderRadius: 3 }}>{e.sku}</code></td>
                          <td style={{ padding: '5px 12px', color: '#dc2626' }}>{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {result.errors.length > 0 && (
                <button className="btn btn-secondary" onClick={() => {
                  setResult(null); setRows(null); setParseError('');
                  if (fileRef.current) fileRef.current.value = '';
                }}>
                  Tekrar Dene
                </button>
              )}
              <button className="btn btn-primary" onClick={onClose}>Kapat</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Ana sayfa ──────────────────────────────────────────────────────────────
export default function Products() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editingId,   setEditingId]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleting,    setDeleting]    = useState(null);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [showImport,  setShowImport]  = useState(false);

  function loadProducts() {
    return api.get('/products').then(r => setProducts(r.data));
  }

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/suppliers'),
    ]).then(([p, c, s]) => {
      setProducts(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleEdit(product) {
    setEditingId(product.id);
    setForm({
      sku:         product.sku,
      name:        product.name,
      description: product.description ?? '',
      categoryId:  String(product.category?.id ?? product.categoryId ?? ''),
      supplierId:  String(product.supplier?.id ?? product.supplierId ?? ''),
      unitPrice:   String(product.unitPrice),
      unit:        product.unit,
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function handleDelete(product) {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) return;
    setDeleting(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setSuccess(`"${product.name}" silindi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ürün silinemedi');
    } finally {
      setDeleting(null);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        supplierId: Number(form.supplierId),
        unitPrice:  Number(form.unitPrice),
      };
      if (editingId) {
        const { data } = await api.put(`/products/${editingId}`, payload);
        setProducts(prev => prev.map(p => p.id === editingId ? data : p));
        setSuccess(`"${data.name}" güncellendi.`);
      } else {
        const { data } = await api.post('/products', payload);
        setProducts(prev => [...prev, data]);
        setSuccess(`"${data.name}" ürünü eklendi.`);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error ?? (editingId ? 'Ürün güncellenemedi' : 'Ürün eklenemedi'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    const rows = filtered.map(p => ({
      'SKU':          p.sku,
      'Ürün Adı':     p.name,
      'Kategori':     p.category?.name ?? '',
      'Tedarikçi':    p.supplier?.name ?? '',
      'Birim Fiyat':  Number(p.unitPrice),
      'Birim':        p.unit,
      'Açıklama':     p.description ?? '',
    }));
    exportToExcel(rows, 'urunler');
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ürünler</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
            ↓ Excel
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            ↑ Excel İçe Aktar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { showForm ? closeForm() : setShowForm(true); setSuccess(''); }}
          >
            {showForm ? 'Formu Kapat' : '+ Yeni Ürün'}
          </button>
        </div>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">{editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>SKU *</label>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  required
                  readOnly={!!editingId}
                  style={editingId ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}}
                />
              </div>
              <div className="form-group">
                <label>Ürün Adı *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Kategori *</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tedarikçi *</label>
                <select name="supplierId" value={form.supplierId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Birim Fiyat *</label>
                <input name="unitPrice" type="number" step="0.01" min="0"
                  value={form.unitPrice} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Birim *</label>
                <input name="unit" placeholder="adet, kg, lt…"
                  value={form.unit} onChange={handleChange} required />
              </div>
              <div className="form-group full">
                <label>Açıklama</label>
                <textarea name="description" value={form.description} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor…' : (editingId ? 'Güncelle' : 'Kaydet')}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            placeholder="SKU veya ürün adı ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            {filtered.length} ürün
          </span>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Tedarikçi</th>
                <th>Birim Fiyat</th>
                <th>Birim</th>
                <th style={{ width: 90, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty">Ürün bulunamadı</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td>{p.supplier?.name ?? '—'}</td>
                  <td>{Number(p.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td>{p.unit}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      title="Düzenle"
                      onClick={() => handleEdit(p)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 6px', borderRadius: 4, color: '#3b82f6',
                        fontSize: '1rem', lineHeight: 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      ✏️
                    </button>
                    <button
                      title="Sil"
                      onClick={() => handleDelete(p)}
                      disabled={deleting === p.id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 6px', borderRadius: 4, color: '#ef4444',
                        fontSize: '1rem', lineHeight: 1,
                        opacity: deleting === p.id ? 0.4 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            loadProducts();
            setSuccess('Excel içe aktarma tamamlandı.');
          }}
        />
      )}
    </div>
  );
}
