import Swal from 'sweetalert2';

export const PremiumSwal = Swal.mixin({
  background: '#18181b', // zinc-900
  color: '#f4f4f5', // zinc-100
  confirmButtonColor: '#d4af37', // Gold
  cancelButtonColor: '#3f3f46', // zinc-700
  customClass: {
    popup: 'rounded-3xl border border-zinc-800/80 font-sans',
    title: 'text-sm font-bold uppercase tracking-wider font-display text-white',
    htmlContainer: 'text-xs text-zinc-400',
    confirmButton: 'px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black font-sans mx-2',
    cancelButton: 'px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white font-sans mx-2'
  },
  buttonsStyling: true
});
