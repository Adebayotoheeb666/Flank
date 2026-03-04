import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";

function Panorama({ url }: { url: string }) {
  const { scene } = useThree();
  const texture = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
    });
  }, [url, scene]);

  return null;
}

export default function PanoramaViewer({ url, title }: { url: string; title?: string }) {
  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-black group">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          rotateSpeed={-0.5} // Reverse rotation for natural feel
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        <Panorama url={url} />
      </Canvas>

      {/* Title/Overlay */}
      <div className="absolute top-4 left-4 z-10 p-3 bg-black/50 backdrop-blur-md rounded-xl text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="font-bold text-lg">{title || "360° View"}</h3>
        <p className="text-xs text-white/70">Drag to interact • Scroll to zoom</p>
      </div>

      {/* Interactive Hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  );
}
