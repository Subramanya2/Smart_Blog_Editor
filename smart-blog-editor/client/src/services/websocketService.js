import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

/**
 * Creates or retrieves a Yjs document and connects it to the WebSocket relay server.
 *
 * @param {string} id Document ID
 * @param {Map<string, Y.Doc>} yjsDocMap Yjs doc cache map
 * @returns {WebsocketProvider}
 */
export function createYjsProvider(id, yjsDocMap) {
  let doc = yjsDocMap.get(id);
  if (!doc) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }
  
  const host = window.location.hostname || 'localhost';
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${host}:8000/ws`;
  
  return new WebsocketProvider(wsUrl, id, doc, { connect: true });
}
