export enum RenderStyle {
  List = 1,
  Table = 2
};

export interface File {
  key: string;
  newKey?: string;
  size?: string;
  name?: string;
  draft?: boolean;
  relativeKey?: string;
  keyDerived?: boolean ;
  modified?: string | Date;
  children: File[];
};

export enum PageCount {
  Five = 5,
  Ten = 10,
  Fifteen = 15,
  Twenty = 20,
  TwentyFive = 25,
  thirty = 30
};
