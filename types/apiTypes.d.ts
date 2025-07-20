export interface IEditorUploadIncomingBody {
  /** BASE64 encoded */ layoutData: string;
  /** BASE64 encoded */ meta: string;
}

export interface IEditorUploadOutgoingBody {
  /** params string for connection to testing env */ testingUrlParams: string;
}
