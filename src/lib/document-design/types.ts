import type { DocumentType } from "@/lib/document-types";
export type DocumentThemeId = "corporate-blue"|"executive-black"|"construction-orange"|"minimal-gray"|"modern-green"|"elegant-gold"|"professional-navy"|"clean-white"|"technical-steel"|"classic-business"|"premium-dark-header"|"soft-modern";
export type FontPairId = "inter-source"|"montserrat-open"|"lato-merriweather"|"roboto-slab"|"poppins-noto"|"work-source-serif"|"ibm-plex";
export type HeaderVariant = "classic-business"|"modern-split"|"hero-title"|"side-rail"|"dark"|"minimal"|"logo-centered"|"logo-left"|"logo-right"|"company-card";
export type FooterVariant = "line"|"three-columns"|"contact"|"banking"|"legal"|"branding"|"page-number"|"qr-placeholder"|"copyright"|"none";
export type TableVariant = "solid"|"striped"|"minimal"|"technical"|"executive";
export type SectionVariant = "plain"|"card"|"bordered"|"colored-header"|"side-accent"|"table-panel"|"shaded";
export type TotalVariant = "right-box"|"full-bar"|"summary-card"|"minimal-table"|"executive-summary";
export type DocumentDensity = "compact"|"comfortable"|"spacious";
export type PaperSize = "A4"|"LETTER";
export type PaperPattern="none"|"horizontal-lines"|"vertical-lines"|"technical-grid"|"dot-grid"|"diagonal-lines"|"geometry"|"corner-details"|"side-line"|"top-line"|"bottom-line"|"page-frame"|"blueprint"|"construction-grid"|"corporate-waves"|"minimal-shapes"|"elegant-curves"|"paper-texture"|"custom";
export type DecorativeLineStyle="solid"|"thin"|"double"|"dashed"|"dotted"|"gradient"|"geometric"|"technical"|"elegant"|"brand";
export type DecorativeShapeType="circle"|"semicircle"|"rectangle"|"rounded-rectangle"|"wave"|"triangle"|"geometric-block"|"grid"|"corner"|"abstract";
export type PageVisibility="all"|"first"|"last"|"odd"|"even";
export interface PaperColorConfig{value:string;intensity:number;source:"palette"|"custom"|"brand";}
export interface BackgroundPatternConfig{enabled:boolean;type:PaperPattern;color:string;opacity:number;lineWidth:number;spacing:number;size:number;angle:number;position:"page"|"header"|"footer"|"left"|"right"|"corners";repeat:boolean;pages:PageVisibility;customCss?:string;}
export interface DecorativeLineConfig{id:string;enabled:boolean;style:DecorativeLineStyle;position:"top"|"bottom"|"left"|"right"|"below-header"|"above-footer"|"frame"|"corners";color:string;thickness:number;length:number;opacity:number;offset:number;pages:PageVisibility;}
export interface DecorativeShapeConfig{id:string;enabled:boolean;type:DecorativeShapeType;x:number;y:number;width:number;height:number;rotation:number;color:string;opacity:number;pages:PageVisibility;locked:boolean;}
export interface PageVariantConfig{firstPageEmphasis:boolean;middleSimplified:boolean;lastPageSignatureAccent:boolean;}
export interface PrintSafeConfig{enabled:boolean;blackAndWhitePreview:boolean;inkLevel:"low"|"medium"|"high";}
export interface WaveDecorationConfig{enabled:boolean;style:"corporate-ribbon"|"soft-curve"|"double-flow";position:"header"|"middle"|"footer";primaryColor:string;secondaryColor:string;opacity:number;height:number;offset:number;flip:boolean;pages:PageVisibility;}
export interface PaperDesignConfig{version:1;presetId:string;color:PaperColorConfig;pattern:BackgroundPatternConfig;lines:DecorativeLineConfig[];shapes:DecorativeShapeConfig[];wave:WaveDecorationConfig;safeZone:boolean;pageVariants:PageVariantConfig;printSafe:PrintSafeConfig;}
export interface PaperPreset{id:string;name:string;description:string;builtIn:boolean;paper:PaperDesignConfig;recommendedFor:(DocumentType|"all")[];createdAt:string;updatedAt:string;}
export interface DocumentStyleConfig { version: 2; themeId: DocumentThemeId; fontPairId: FontPairId; accentColor: string; secondaryColor: string; headingColor: string; textColor: string; mutedColor: string; surfaceColor: string; paperColor: string; headingFont: string; bodyFont: string; tableFont: string; smallFont: string; fontSize: number; density: DocumentDensity; headerVariant: HeaderVariant; footerVariant: FooterVariant; tableVariant: TableVariant; sectionVariant: SectionVariant; totalVariant: TotalVariant; signatureVariant: "one"|"two-columns"|"three-columns"|"signature-stamp"; page: { size: PaperSize; orientation: "portrait"|"landscape"; margins: { top: number; right: number; bottom: number; left: number }; headerHeight: number; footerHeight: number; showPageNumber: boolean; showPageBorder: boolean; }; watermark: { enabled: boolean; text: string; color: string; opacity: number; angle: number; }; paper:PaperDesignConfig; documentCharacter: DocumentType; }
export interface BrandKit { id: string; name: string; primaryColor: string; secondaryColor: string; accentColor: string; fontPairId: FontPairId; logo?: string; alternateLogo?: string; stamp?: string; signatures: string[]; footerText: string; defaultThemeId: DocumentThemeId; defaultByType: Partial<Record<DocumentType, DocumentStyleConfig>>; }
export interface DocumentTheme { id: DocumentThemeId; name: string; description: string; style: Omit<DocumentStyleConfig,"documentCharacter">; }
