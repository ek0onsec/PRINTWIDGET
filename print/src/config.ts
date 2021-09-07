import { ImmutableObject } from "seamless-immutable";


export interface Config {
  serviceURL: string,
  defaultTitle: string,
  defaultAuthor: string,
  defaultCopyright: string,
  defaultFormat: "pdf"|"png32"|"png8"|"jpg"|"gif"|"eps"|"svg"|"svgz",
  defaultLayout: "map-only"|"a3-landscape"|"a3-portrait"|"a4-landscape"|"a4-portrait"|"letter-ansi-a-landscape"|"letter-ansi-a-portrait"|"tabloid-ansi-b-landscape"|"tabloid-ansi-b-portrait"
}

export type IMConfig = ImmutableObject<Config>;