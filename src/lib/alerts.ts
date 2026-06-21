/**
 * @file alerts.ts
 * @description Global notification service using SweetAlert2.
 * Wraps alerts with the Oasis corporate design language (Glassmorphism, rounded-md, OKLCH colors).
 * Explicitly forces CSS animations to prevent Tailwind resets from breaking them.
 */

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Configurador base para mantener la estética Premium de Oasis
const baseConfig = {
  // Aseguramos que el fondo de la alerta sea totalmente transparente para que el Glassmorphism funcione
  background: 'transparent',
  // Quitamos los bordes y padding default de SweetAlert
  padding: '0',
  backdrop: 'rgba(0, 0, 0, 0.4)', // Fondo oscuro detrás de la alerta
  buttonsStyling: false,
  showClass: {
    popup: 'animate-in zoom-in-95 duration-200'
  },
  hideClass: {
    popup: 'animate-out zoom-out-95 duration-200'
  },
  customClass: {
    // 🚀 AÑADIDO: Padding explícito y forzando el Glassmorphism en el popup principal
    popup: 'bg-card/95 backdrop-blur-2xl border border-border/50 rounded-md shadow-2xl font-sans p-6 overflow-hidden dark:ring-1 dark:ring-white/10',
    title: 'text-2xl font-black tracking-tight text-foreground font-serif mt-4',
    htmlContainer: 'text-muted-foreground font-medium text-sm mt-2 mb-6',
    confirmButton: 'bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-md shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all',
    cancelButton: 'bg-transparent text-muted-foreground font-bold px-6 py-2.5 hover:bg-accent/50 rounded-md transition-colors',
    actions: 'gap-3 w-full justify-center', // Centra los botones y les da espacio
    // 🚀 AÑADIDO: Protegemos el contenedor del icono
    icon: 'border-0 scale-110 mb-2', 
  },
};

export const Alerts = {
  /**
   * Alerta de Éxito (Con check animado garantizado)
   */
  success: (title: string, text: string) => {
    return MySwal.fire({
      ...baseConfig,
      icon: 'success',
      iconColor: 'hsl(var(--primary))', // Toma el color primario del tema
      title: title,
      text: text,
      confirmButtonText: 'Understood',
    });
  },

  /**
   * Alerta de Error
   */
  error: (title: string, text: string) => {
    return MySwal.fire({
      ...baseConfig,
      icon: 'error',
      iconColor: 'hsl(var(--destructive))',
      title: title,
      text: text,
      confirmButtonText: 'Acknowledge',
    });
  },

  /**
   * Alerta de Confirmación
   */
  confirm: async (title: string, text: string, confirmText: string = 'Confirm') => {
    const result = await MySwal.fire({
      ...baseConfig,
      icon: 'warning',
      iconColor: 'hsl(var(--chart-2))',
      title: title,
      text: text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    return result.isConfirmed;
  },
  
  /**
   * Toast Flotante (Esquina superior derecha)
   */
  toast: (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    return MySwal.fire({
      ...baseConfig,
      toast: true,
      position: 'top-end',
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      backdrop: false, // Los toasts no deben oscurecer la pantalla
      customClass: {
        popup: 'bg-card/95 backdrop-blur-xl border border-border/50 rounded-md shadow-lg mt-16 mr-4 flex items-center p-3',
        title: 'text-sm font-bold text-foreground m-0 ml-2',
        timerProgressBar: 'bg-primary',
        icon: 'scale-75 m-0 border-0'
      }
    });
  }
};