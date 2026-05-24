export type OidValue = {
    $oid: string;
};
export declare const isOidObject: (value: unknown) => value is OidValue;
export declare const extractOid: (value: unknown) => string | null;
export declare const wrapOid: (oid: string) => OidValue;
