type PermissionDetails = {
  origins: string[];
};

type HostPermissionApi = {
  contains(details: PermissionDetails): Promise<boolean>;
  request(details: PermissionDetails): Promise<boolean>;
};

type BrowserLike = {
  permissions?: HostPermissionApi;
};

function resolvePermissionsApi(): HostPermissionApi {
  const browserLike = globalThis.browser as BrowserLike | undefined;
  if (browserLike?.permissions) {
    return browserLike.permissions;
  }

  const chromeLike = globalThis.chrome as BrowserLike | undefined;
  if (chromeLike?.permissions) {
    return chromeLike.permissions;
  }

  throw new Error('Host permissions API is unavailable outside extension runtime.');
}

export async function hasHostPermission(origins: string[]): Promise<boolean> {
  return resolvePermissionsApi().contains({ origins });
}

export async function requestHostPermission(
  origins: string[]
): Promise<boolean> {
  return resolvePermissionsApi().request({ origins });
}
