import React from 'react'

export default function PaymentOption({
  paymentQRs,
  isManagingQR,
  setIsManagingQR,
  handleAddQR,
  newBankName,
  setNewBankName,
  setNewQRImage,
  uploadingQR,
  handleDeleteQR,
  setSelectedQR,
  activeThemeObj
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Payment QR Codes</h3>
          <p className="text-xs text-slate-500">Tap any QR card to show customers for quick scanning.</p>
        </div>
        {paymentQRs.length > 0 && (
          <button
            onClick={() => setIsManagingQR(!isManagingQR)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isManagingQR ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
          >
            {isManagingQR ? 'Done Managing' : 'Manage QR'}
          </button>
        )}
      </div>

      <form onSubmit={handleAddQR} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Bank / E-Wallet QR</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank / Wallet Label</label>
            <input
              type="text"
              placeholder="e.g. Maya, BPI, Maribank..."
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">QR Code Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewQRImage(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={uploadingQR}
          className={`px-4 py-2 ${activeThemeObj.primary} text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50`}
        >
          {uploadingQR ? 'Uploading to Cloud...' : 'Upload Payment QR'}
        </button>
      </form>

      {paymentQRs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No payment QR codes added yet. Use the form above to upload your first QR.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {paymentQRs.map((qr) => (
            <div
              key={qr.id}
              onClick={() => !isManagingQR && setSelectedQR(qr)}
              className={`relative bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center space-y-3 transition ${!isManagingQR ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md active:scale-98' : ''}`}
            >
              {isManagingQR && (
                <button
                  onClick={(e) => handleDeleteQR(qr.id, e)}
                  className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition"
                  title="Remove QR"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <div className="w-28 h-28 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 p-1">
                <img src={qr.qrUrl} alt={qr.name} className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-900 text-xs text-center">{qr.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}