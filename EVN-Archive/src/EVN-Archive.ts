import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

export interface ExpListInterface {
    exp: string[];
    src: string[];
 }

export interface SearchInterface {
  obs_id?: string;
  target_name?: string[];
  band?: string[];
  s_ra?: string;
  s_dec?: string;
  radius?: number;
  notebook?: string;
}

export interface SearchResult {
   obs_id: string; 
   target_name: string; 
   s_ra: string;
   s_dec: string;
   distance?: string;
   notebook?: string;
   size?: string;
}
export interface SearchResultInterface extends Array<SearchResult>{}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {},
  search: SearchInterface = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const searchParams = new URLSearchParams();
  Object.entries(search).forEach(([key, val]) => {
    if ((Array.isArray(val)) && (val.length > 0)) {
      searchParams.append(key, JSON.stringify(val));
    } else if (typeof val == "number") {
      searchParams.append(key, String(val));
    } else if (val != "") {
      searchParams.append(key, val);
    }
  });
  let searchString : string = searchParams.toString();

  const requestUrl = URLExt.join(
    settings.baseUrl,
    'EVN-Archive', // API Namespace
    endPoint,
    (searchString == "") ? "" : "?" + searchString
  );

  let response: Response;
  try {
    console.log('requrl = ', requestUrl);
    console.log('init = ', init);
    console.log('settings = ', settings);
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data) as ExpListInterface;
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}
