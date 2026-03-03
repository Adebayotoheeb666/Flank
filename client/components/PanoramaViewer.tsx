import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PanoramaViewerProps {
  imageUrl: string;
  title: string;
}

export default function PanoramaViewer({ imageUrl, title }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 0.1;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load panorama texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        // Create sphere geometry for panorama
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert to view from inside

        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error("Failed to load panorama:", error);
        setIsLoading(false);
      }
    );

    // Mouse interaction for panorama
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      camera.rotation.order = "YXZ";
      camera.rotation.y -= deltaX * 0.01;
      camera.rotation.x -= deltaY * 0.01;

      // Clamp vertical rotation
      if (camera.rotation.x > Math.PI / 2) camera.rotation.x = Math.PI / 2;
      if (camera.rotation.x < -Math.PI / 2) camera.rotation.x = -Math.PI / 2;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);

    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;

      camera.rotation.order = "YXZ";
      camera.rotation.y -= deltaX * 0.01;
      camera.rotation.x -= deltaY * 0.01;

      if (camera.rotation.x > Math.PI / 2) camera.rotation.x = Math.PI / 2;
      if (camera.rotation.x < -Math.PI / 2) camera.rotation.x = -Math.PI / 2;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    renderer.domElement.addEventListener("touchstart", onTouchStart);
    renderer.domElement.addEventListener("touchmove", onTouchMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [imageUrl]);

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.rotation.set(0, 0, 0);
    }
  };

  const pan = (deltaX: number, deltaY: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.rotation.order = "YXZ";
    cameraRef.current.rotation.y -= deltaX * 0.1;
    cameraRef.current.rotation.x -= deltaY * 0.1;

    if (cameraRef.current.rotation.x > Math.PI / 2) cameraRef.current.rotation.x = Math.PI / 2;
    if (cameraRef.current.rotation.x < -Math.PI / 2) cameraRef.current.rotation.x = -Math.PI / 2;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black">
      <div
        ref={containerRef}
        className="w-full aspect-video"
        style={{ touchAction: "none" }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur rounded-full p-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-9 w-9 text-white hover:bg-white/20 p-0"
          onClick={() => pan(0, 0.5)}
          title="Look up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-9 w-9 text-white hover:bg-white/20 p-0"
          onClick={() => pan(-0.5, 0)}
          title="Look left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-9 w-9 text-white hover:bg-white/20 p-0"
          onClick={resetView}
          title="Reset view"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-9 w-9 text-white hover:bg-white/20 p-0"
          onClick={() => pan(0.5, 0)}
          title="Look right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full h-9 w-9 text-white hover:bg-white/20 p-0"
          onClick={() => pan(0, -0.5)}
          title="Look down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Badge */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-4 py-2 rounded-full">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-300">Drag to explore • Use arrow buttons to navigate</p>
      </div>
    </div>
  );
}
