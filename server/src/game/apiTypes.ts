interface IEditorUploadIncomingBody {
  /** BASE64 encoded */ layoutData: string;
  /** BASE64 encoded */ meta: string;
}

interface IEditorUploadOutgoingBody {
  /** params string for connection to testing env */ testingUrlParams: string;
}
