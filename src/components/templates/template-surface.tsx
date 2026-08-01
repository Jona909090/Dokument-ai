"use client";

import type { DocumentType } from "@/lib/document-types";
import type {
  DecorativeLineConfig,
  DecorativeShapeConfig,
  DocumentStyleConfig,
  WaveDecorationConfig,
} from "@/lib/document-design";
import {
  defaultDocumentStyle,
  documentStyleCss,
  migratePaperDesign,
} from "@/lib/document-design";

export function TemplateSurface({
  type,
  style,
  children,
  className = "",
}: {
  type: DocumentType;
  style?: DocumentStyleConfig;
  children: React.ReactNode;
  className?: string;
}) {
  const current = style ?? defaultDocumentStyle(type);
  const paper = migratePaperDesign(current.paper);

  return (
    <div
      data-document-type={type}
      data-theme-id={current.themeId}
      data-header={current.headerVariant}
      data-table={current.tableVariant}
      data-density={current.density}
      data-print-safe={paper.printSafe.enabled}
      className={`template-surface document-design-surface ${className}`}
      style={documentStyleCss({ ...current, paper })}
    >
      <div className="paper-decoration-layer" aria-hidden="true">
        {paper.lines
          .filter((value) => value.enabled)
          .map((line) => <PaperLine key={line.id} line={line} />)}
        {paper.shapes
          .filter((value) => value.enabled)
          .map((shape) => <PaperShape key={shape.id} shape={shape} />)}
        {paper.wave.enabled && <PaperWave wave={paper.wave} />}
      </div>
      {current.watermark.enabled && (
        <span
          aria-hidden="true"
          className="document-watermark"
          style={{
            color: current.watermark.color,
            opacity: current.watermark.opacity,
            transform: `translate(-50%,-50%) rotate(${current.watermark.angle}deg)`,
          }}
        >
          {current.watermark.text}
        </span>
      )}
      <div className="paper-content-layer">{children}</div>
    </div>
  );
}

function PaperWave({ wave }: { wave: WaveDecorationConfig }) {
  const positionOffset =
    wave.position === "header"
      ? wave.offset
      : wave.position === "middle"
        ? Math.max(35, wave.offset)
        : Math.max(65, wave.offset);
  const paths = wavePaths[wave.style];

  return (
    <svg
      className="paper-wave-decoration"
      viewBox="0 0 1000 260"
      preserveAspectRatio="none"
      style={{
        top: `${positionOffset}%`,
        height: `${wave.height}%`,
        opacity: wave.opacity,
        transform: wave.flip ? "scaleX(-1)" : undefined,
      }}
    >
      <path d={paths.secondary} fill={wave.secondaryColor} />
      <path d={paths.primary} fill={wave.primaryColor} />
    </svg>
  );
}

const wavePaths: Record<
  WaveDecorationConfig["style"],
  { primary: string; secondary: string }
> = {
  "corporate-ribbon": {
    secondary:
      "M0 190 C130 25 270 20 430 115 C610 225 765 220 1000 15 L1000 74 C760 275 590 270 410 160 C255 65 125 60 0 240 Z",
    primary:
      "M0 215 C125 55 265 48 420 142 C600 252 770 245 1000 42 L1000 92 C770 285 590 286 395 172 C248 86 120 85 0 258 Z",
  },
  "soft-curve": {
    secondary:
      "M0 145 C210 20 380 35 535 120 C690 205 820 190 1000 55 L1000 105 C820 235 680 245 510 155 C350 70 185 65 0 205 Z",
    primary:
      "M0 175 C190 65 350 72 510 150 C690 238 835 220 1000 92 L1000 132 C820 260 675 270 490 180 C330 102 175 98 0 230 Z",
  },
  "double-flow": {
    secondary:
      "M0 80 C170 210 330 210 500 85 C680 -45 825 0 1000 145 L1000 190 C820 45 675 5 510 125 C330 255 160 252 0 130 Z",
    primary:
      "M0 112 C165 232 330 232 500 112 C680 -15 830 30 1000 170 L1000 215 C825 78 680 40 515 153 C330 280 155 275 0 158 Z",
  },
};

function PaperLine({ line }: { line: DecorativeLineConfig }) {
  const vertical = line.position === "left" || line.position === "right";
  const position: React.CSSProperties = vertical
    ? {
        top: `${line.offset}%`,
        [line.position]: 0,
        height: `${line.length}%`,
        width: line.thickness,
      }
    : {
        left: `${(100 - line.length) / 2}%`,
        [
          line.position === "below-header"
            ? "top"
            : line.position === "above-footer"
              ? "bottom"
              : line.position
        ]: 0,
        width: `${line.length}%`,
        height: line.thickness,
      };

  return (
    <span
      className={`paper-line paper-line-${line.style} paper-line-${line.position}`}
      style={{
        ...position,
        backgroundColor: line.color,
        opacity: line.opacity,
        borderStyle:
          line.style === "dashed"
            ? "dashed"
            : line.style === "dotted"
              ? "dotted"
              : "solid",
      }}
    />
  );
}

function PaperShape({ shape }: { shape: DecorativeShapeConfig }) {
  return (
    <span
      className={`paper-shape paper-shape-${shape.type}`}
      style={{
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        width: `${shape.width}%`,
        height: `${shape.height}%`,
        backgroundColor: shape.color,
        opacity: shape.opacity,
        transform: `rotate(${shape.rotation}deg)`,
        borderRadius: shape.type.includes("circle")
          ? "999px"
          : shape.type === "rounded-rectangle"
            ? "18px"
            : undefined,
      }}
    />
  );
}
