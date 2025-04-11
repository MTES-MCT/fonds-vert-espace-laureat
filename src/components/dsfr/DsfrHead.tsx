import AppleTouchIcon from "@codegouvfr/react-dsfr/dsfr/favicon/apple-touch-icon.png";
import FaviconIco from "@codegouvfr/react-dsfr/dsfr/favicon/favicon.ico";
import FaviconSvg from "@codegouvfr/react-dsfr/dsfr/favicon/favicon.svg";
import marianneBoldWoff2Url from "@codegouvfr/react-dsfr/dsfr/fonts/Marianne-Bold.woff2";
import marianneMediumWoff2Url from "@codegouvfr/react-dsfr/dsfr/fonts/Marianne-Medium.woff2";
import marianneRegularWoff2Url from "@codegouvfr/react-dsfr/dsfr/fonts/Marianne-Regular.woff2";
import { getAssetUrl } from "@codegouvfr/react-dsfr/tools/getAssetUrl";
import React from "react";

const preloadedFont = [
  marianneRegularWoff2Url,
  marianneMediumWoff2Url,
  marianneBoldWoff2Url,
];

export function DsfrHead() {
  return (
    <>
      <link rel="apple-touch-icon" href={getAssetUrl(AppleTouchIcon)} />
      <link rel="icon" href={getAssetUrl(FaviconSvg)} type="image/svg+xml" />
      <link
        rel="shortcut icon"
        href={getAssetUrl(FaviconIco)}
        type="image/x-icon"
      />
      {preloadedFont.map((url) => (
        <link
          key={url}
          href={url}
          rel="preload"
          type="font/woff2"
          as="font"
          crossOrigin="anonymous"
        />
      ))}
    </>
  );
}
