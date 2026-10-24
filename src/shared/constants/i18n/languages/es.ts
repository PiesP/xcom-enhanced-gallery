// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Spanish language strings for the application
 */
export const es: LanguageStrings = {
  tb: {
    prev: 'Anterior',
    next: 'Siguiente',
    dl: 'Descargar',
    dlAllCt: 'Descargar los {count} archivos visibles como ZIP',
    setOpen: 'Abrir configuración',
    cls: 'Cerrar',
    twTxt: 'Ver tweet',
    twPanel: 'Panel de texto del tweet',
    twUrl: 'Ver tweet original',
    fitOri: 'Original',
    fitW: 'Ajustar ancho',
    fitH: 'Ajustar alto',
    fitC: 'Ajustar ventana',
    currentFit: 'Ajuste: {mode}',
    mediaPosition: 'Archivo {index} de {total}',
    noMedia: 'Sin archivos',
    galleryToolbar: 'Barra de herramientas de la galería',
    navigationGroup: 'Navegación y posición',
    fitGroup: 'Ajuste de vista',
    downloadGroup: 'Descargas',
    auxGroup: 'Más acciones',
    settingsPanel: 'Panel de configuración',
  },
  st: {
    th: 'Tema',
    lang: 'Idioma',
    thAuto: 'Automático',
    thLt: 'Claro',
    thDk: 'Oscuro',
    langAuto: 'Automático',
    langKo: 'Coreano',
    langEn: 'Inglés',
    langJa: 'Japonés',
    langZhCn: 'Chino simplificado',
    langEs: 'Español',
    langAr: 'Árabe',
    videoClickMode: 'Clics en vídeos',
    videoClickNative: 'Mantener los clics en X',
    videoClickSurfaces: 'Abrir la galería desde el vídeo',
    videoClickUnmarked: 'Incluir botones de reproducción aptos',
    videoClickHelp:
      'Los dos últimos modos abren la galería al pulsar un vídeo apto. Solo el último incluye botones de reproducción sin marcar y verificados; los controles normales siguen en X.',
    videoClickSaveError:
      'No se pudo guardar la opción de clics en vídeos. La configuración actual sigue activa. Inténtalo de nuevo.',
    unsavedSettings: 'Los ajustes están activos en esta sesión, pero no se guardaron.',
    retrySettingsSave: 'Reintentar guardado',
  },
  msg: {
    err: {
      t: 'Ocurrió un error',
      b: 'Ocurrió un error inesperado: {error}',
      loadMedia: {
        unsupported:
          'Este vídeo solo ofrece streaming HLS. La reproducción y descarga en la galería requieren una fuente MP4 verificada.',
        noMedia: 'No se devolvió contenido multimedia para esta publicación.',
        denied: 'El servicio multimedia rechazó la solicitud. Inténtalo más tarde.',
        unreadable: 'No se pudo leer la respuesta multimedia. Inténtalo más tarde.',
        resourceLimit:
          'Este post supera el límite de datos. Ábrelo en X para ver su contenido multimedia.',
        rateLimited: 'El servicio multimedia está limitando las solicitudes. Inténtalo más tarde.',
        deferred: 'El servicio multimedia pidió esperar. Inténtalo más tarde.',
        providerError:
          'El servicio multimedia no pudo proporcionar esta publicación. Inténtalo más tarde.',
        transport: 'No se pudo contactar con el servicio multimedia. Inténtalo más tarde.',
        ownerUnconfirmed:
          'No se pudo confirmar a qué publicación pertenece el contenido seleccionado.',
        mismatch: 'El contenido recibido no coincide con el elemento seleccionado.',
        cancelled: 'Se canceló la carga del contenido multimedia.',
        nativeVideoRecovery:
          'Usa los controles de reproducción y pausa del vídeo en X o pulsa Alt+Shift+V para mantener los clics en X.',
        nativeVideoControls:
          'Usa los controles de reproducción y pausa del vídeo en X para seguir viendo.',
        nativeVideoEnabled:
          'Los clics en vídeos ahora permanecen en X. Cambia Clics en vídeos en la configuración de la galería para volver a usarla.',
        title: 'Error al cargar contenido multimedia',
        body: 'No se encontraron imágenes ni videos.',
      },
      generic: 'Ocurrió un error',
      loadGallery: 'Error al cargar la galería',
      settingsUnavailable: {
        title: 'Configuración no disponible',
        body: 'Se usarán valores predeterminados hasta que se cargue la configuración.',
      },
      retry: 'Reintentar',
      noMoreRetries: 'No hay más reintentos',
      reset: 'Restablecer',
    },
    kb: {
      t: 'Atajos de teclado',
      prev: 'ArrowLeft: Medio anterior',
      next: 'ArrowRight: Medio siguiente',
      cls: 'Escape: Cerrar galería',
      toggle: '?: Mostrar esta ayuda',
    },
    dl: {
      status: {
        working: 'Preparando la descarga…',
        handedOff: 'Solicitud entregada al navegador',
        error: 'Error de descarga',
      },
      one: {
        err: {
          t: 'Descarga fallida',
          b: 'No se pudo descargar el archivo: {error}',
        },
      },
      allFail: {
        t: 'Descarga fallida',
        b: 'No se pudo descargar ningún elemento.',
      },
      part: {
        t: 'Fallo parcial',
        b: 'No se pudieron descargar {count} elementos.',
        resourceLimit:
          'El ZIP incluye {count} archivos; se omitieron {failed}. Se alcanzó el límite de memoria para descargas. Espera a que terminen las descargas en curso. Si no hay ninguna activa y el límite persiste, recarga esta página. Después, vuelve a intentarlo con menos archivos.',
      },
      noMedia: 'Ningún elemento multimedia seleccionado. Reabra la galería e intente de nuevo.',
      zipFail: 'Error al guardar el archivo ZIP',
      sourceUnavailable:
        'No se pudo verificar la fuente de la imagen original. Este elemento no se guardó. Abre de nuevo la publicación e inténtalo otra vez.',
      resourceLimit:
        'Se alcanzó el límite de memoria para descargas. Espera a que terminen las descargas en curso. Si no hay ninguna activa y el límite persiste, recarga esta página. Después, vuelve a intentarlo con menos archivos.',
    },
    gal: {
      video: {
        playbackFallback:
          'La reproducción usa otra versión; la descarga conserva la mejor fuente disponible.',
      },
      observedQuality: {
        title: 'Calidad de la fuente recuperada',
        body: 'No se pudo verificar la calidad de algunos elementos. Las imágenes sin un original verificado no se pueden guardar; los vídeos recuperados usan la fuente observada.',
      },
      partialRecovery: {
        title: 'Solo los medios visibles',
        body: 'Solo se recuperaron los medios de este recuadro. La descarga masiva incluye solo los elementos mostrados.',
      },
      emptyT: 'Sin medios disponibles',
      emptyD: 'No hay imágenes ni videos para mostrar.',
      itemLbl: 'Medio {index}: {filename}',
      loadFail: 'Error al cargar {type}',
      imageGallery: 'Galería de imágenes',
      loading: 'Cargando',
      videoCount: 'Video {index} de {total}',
      imageCount: 'Imagen {index} de {total}: {alt}',
      hashtagLabel: 'Hashtag {value}',
    },
  },
};
