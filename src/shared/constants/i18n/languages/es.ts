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
    helpOpen: 'Ayuda del teclado',
    helpPanel: 'Panel de ayuda del teclado',
    helpClose: 'Cerrar ayuda',
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
    videoClickSurfaces: 'Abrir la galería desde el área del vídeo',
    videoClickUnmarked: 'Abrir también desde botones de reproducción compatibles',
    videoClickHelp:
      'Elige dónde se gestionan los clics de vídeo admitidos. La galería abre otro reproductor, pausado desde el principio, con sus preferencias de audio guardadas. Al cerrarla, X no reanuda la reproducción automáticamente. Los controles habituales del reproductor siguen en X.',
    videoClickSaveError:
      'No se pudo guardar la opción de clics en vídeos. La configuración actual sigue activa. Inténtalo de nuevo.',
    unsavedSettings: 'Los ajustes están activos en esta sesión, pero no se guardaron.',
    unsavedSession: 'Activo en esta sesión · sin guardar',
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
      prev: 'Izquierda: elemento anterior',
      next: 'Derecha: elemento siguiente',
      cls: 'Escape: cerrar la galería. Con el foco en la barra de herramientas, cerrar primero Configuración o la ayuda de teclado si están abiertos',
      toggle: '?: abrir esta ayuda',
      firstLast: 'Home / End: primer / último elemento',
      five: 'PageUp / PageDown: retroceder / avanzar cinco elementos',
      vertical: 'Arriba / Abajo: cambiar de imagen; ajustar el volumen del vídeo mostrado',
      playback: 'Espacio: reproducir o pausar el vídeo; M: activar o desactivar el silencio',
      focus: 'Tab / Mayús+Tab: recorrer los controles',
      context:
        'Los botones enfocados conservan Espacio / Intro; los formularios y paneles gestionan sus propias teclas.',
      recovery: 'Alt+Mayús+V solo está disponible tras un clic de vídeo admitido que haya fallado.',
    },
    dl: {
      filenameNotice: {
        label: 'Nombre de archivo guardado',
        mismatch: 'El nombre guardado es diferente del solicitado.',
        dismiss: 'Descartar aviso del nombre de archivo',
      },
      bulkOutcome: {
        cancelRecoveryAndDismiss:
          'Cancelar la recuperación de elementos omitidos y cerrar el resultado ZIP',
        details: 'Detalles del resultado ZIP',
        titleHandedOff: 'ZIP entregado al navegador',
        titleFailed: 'No se entregó ningún ZIP',
        previous: 'Resultado anterior del ZIP',
        scope: 'Alcance: {total} elementos mostrados en esta galería.',
        scopeSupplementary: 'Alcance: {total} elementos omitidos anteriormente en esta galería.',
        counts: 'El ZIP incluye {included}; se omitieron {omitted}.',
        browserHandoff:
          'El navegador aceptó la solicitud del ZIP. No se ha confirmado que se guardara en el disco.',
        noZip: 'No se entregó ningún ZIP al navegador.',
        resourceLimit:
          'Se alcanzó el límite de memoria de descarga. Espera a que terminen las descargas activas; si persiste, recarga la página.',
        sourceUnavailable:
          'No se pudo verificar el origen de una imagen. Vuelve a la publicación original para intentar descargarla.',
        sourceFetchFailed:
          'Falló una solicitud al origen del contenido (HTTP {statuses}). Vuelve a la publicación original y reintenta los elementos omitidos.',
        zipSaveFailed: 'El ZIP se preparó, pero el navegador no aceptó la solicitud de guardado.',
        other:
          'No se pudieron incluir algunos elementos. Vuelve a abrir la galería e inténtalo de nuevo.',
        nextAction:
          'Descargar todo crea otro ZIP con todos los elementos mostrados, incluso los ya entregados. Si hace falta, vuelve a la publicación e inténtalo con menos elementos.',
        nextActionSupplementary:
          'Este ZIP solo contiene elementos recuperados. Conserva el ZIP anterior con los demás elementos.',
        recoverMissing: 'Descargar {count} elementos pendientes en otro ZIP',
        dismiss: 'Cerrar resultado del ZIP',
      },
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
      sourceDetails: {
        title: 'Detalles del contenido y guardado',
        shown: '{count} elementos recopilados · la publicación puede contener más',
        knownSubset: '{count} elementos compatibles · algunos medios no se pueden guardar',
        cdnOriginal: 'Origen de guardado: imagen original verificada de la CDN de X.',
        bestMp4: 'Origen de guardado: mejor MP4 disponible en X.',
        observed: 'No se ha verificado la calidad del vídeo guardado',
        observedDetail:
          'Se guarda la fuente de vídeo observada. La reproducción puede usar otra versión.',
        unavailable: 'Imagen original no disponible para guardar',
        unavailableDetail:
          'No se encontró una imagen original verificada. Este elemento no se puede guardar ni se sustituye por una versión de menor calidad.',
        pending: 'La imagen original se comprobará al guardar',
        pendingDetail:
          'Esta imagen aún no se ha comprobado. Se verificará el origen antes de guardarla sola o en el ZIP.',
        retryable: 'No se pudo confirmar la imagen original',
        retryableDetail:
          'La comprobación no confirmó si existe el original. Prueba a guardar de nuevo; no se usará una versión de menor calidad.',
      },
      entryFailureNext: 'Consulta este contenido en la publicación de X.',
      downloadFailureNext:
        'Comprueba el estado en las descargas del navegador o vuelve a la publicación de X.',
      dismissFailure: 'Cerrar aviso de error',
      mediaType: { image: 'Imagen', video: 'Vídeo' },
      video: {
        playbackFallback:
          'La reproducción usa otra versión; la descarga conserva la mejor fuente disponible.',
      },
      observedQuality: {
        title: 'Calidad de la fuente recuperada',
        body: 'No se pudo verificar la calidad de algunos elementos. Las imágenes necesitan un original verificado antes de guardarse; los vídeos recuperados usan la fuente observada.',
      },
      partialRecovery: {
        title: 'Solo los medios visibles',
        body: 'Solo se recopiló el contenido disponible ahora. La publicación puede contener más; la descarga masiva incluye solo los elementos recopilados.',
      },
      knownSubset: {
        title: 'Algunos medios no se pueden guardar',
        body: 'La fuente incluye medios no compatibles. La galería y el ZIP contienen solo los elementos compatibles recopilados.',
      },
      emptyT: 'Sin medios disponibles',
      emptyD: 'No hay imágenes ni videos para mostrar.',
      itemLbl: 'Medio {index}: {filename}',
      loadFail: 'Error al cargar {type}',
      imageGallery: 'Galería de imágenes',
      loading: 'Cargando',
      opening: 'Abriendo galería…',
      retryLoading: 'Reintentar carga',
      retryExhausted:
        'Aún no se puede cargar. Vuelve a abrir la galería o inténtalo en la publicación original.',
      openOriginalPost: 'Abrir publicación original',
      videoCount: 'Video {index} de {total}',
      imageCount: 'Imagen {index} de {total}: {alt}',
      hashtagLabel: 'Hashtag {value}',
    },
  },
};
