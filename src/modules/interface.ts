export interface GraghQueryRequest {
  operationName: string;
  query: string;
  variables: Record<string, any>;
}
