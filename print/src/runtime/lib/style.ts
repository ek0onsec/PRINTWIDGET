import { ThemeVariables, css, SerializedStyles } from 'jimu-core';
import { IMConfig } from '../../config';

export function getStyle(theme: ThemeVariables, widgetConfig: IMConfig): SerializedStyles {

  const root = theme.surfaces[1].bg;

  return css`
    overflow: auto;
    .widget-print {
      width: 100%;
      height: 100%;
      background-color: ${root};
    }

    .esri-print.esri-widget label {
      display: block;
      margin-bottom: .5rem;
    }

    .esri-print__header-title {
      display: none !important;
    }

    .esri-print__exported-file-link {
      color: #6e6e6e;
      display: flex;
      align-items: flex-start;
      margin-bottom: 6px;
      text-decoration: none;
    }

    .esri-print__exported-file-link:hover {
      color: #2e2e2e;
    }

    a:-webkit-any-link:focus {
      outline-offset: 1px;
    }

    .esri-widget__heading {
      color: #323232;
      font-weight: 600;
      margin: 0 0 .5rem 0;
    }

    .esri-print__exported-file-link-title {
      white-space: pre-wrap;
      word-break: break-all;
      word-wrap: break-word;
      word-break: break-word;
      line-height: 1.8em;
    }

    .esri-widget__anchor--disabled {
      pointer-events: none;
      opacity: .4;
    }

    .esri-print__exported-file--error {
      color: #8c2907;
      cursor: pointer;
    }
  `;
}
