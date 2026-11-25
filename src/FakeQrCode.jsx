import { fakeQrMatrix } from "./fakeQr";

// Draws the fake QR code (see fakeQr.js) as a picture. It cannot be scanned.
export default function FakeQrCode({ seed }) {
  const cells = fakeQrMatrix(seed);
  const margin = 2; // light border around the code
  const box = cells.length + margin * 2;
  let path = "";
  cells.forEach((row, r) => row.forEach((dark, c) => { if (dark) path += `M${c + margin} ${r + margin}h1v1h-1z`; }));
  return (
    <svg viewBox={`0 0 ${box} ${box}`} role="img" aria-label="Demo QR code. It is a picture only and cannot be scanned." shapeRendering="crispEdges">
      <rect width={box} height={box} fill="#fff" />
      <path d={path} fill="#111827" />
    </svg>
  );
}
