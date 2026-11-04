/*
 * Backup through the phone's share menu (Google Drive, WhatsApp to yourself, email…).
 * Data stays on the device by default; this only runs when the student taps Back up.
 * Chrome on Android shares .txt files but not .json, so the backup is a .txt file containing JSON.
 */
window.ElogBackup = {
  canShareFiles: function () {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] })); } catch (e) { return false; }
  },
  /** Resolves to 'shared', 'downloaded' or 'cancelled'. */
  save: function (name, text, title) {
    var file = new File([text], name + '.txt', { type: 'text/plain' });
    if (this.canShareFiles()) {
      return navigator.share({ files: [file], title: title || 'Logbook backup' })
        .then(function () { return 'shared'; })
        .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : ElogBackup.download(file); });
    }
    return Promise.resolve(this.download(file));
  },
  download: function (file) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return 'downloaded';
  },
  ACCEPT: '.json,.txt,application/json,text/plain'
};
