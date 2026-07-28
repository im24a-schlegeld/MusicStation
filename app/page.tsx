import Script from "next/script";
import { BlobBridge } from "./BlobBridge";

export default function HomePage() {
  return (
    <>
      <div id="launch-screen" className="app-launch-screen" aria-hidden="true">
        <img className="app-launch-logo" src="/assets/brand-logo.png" alt="" draggable={false} />
      </div>
      <div id="app" />
      <BlobBridge />
      <Script type="module" src="/src/main.js" strategy="afterInteractive" />
    </>
  );
}
