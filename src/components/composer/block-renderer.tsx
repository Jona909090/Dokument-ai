import Image from "next/image";
import { bindingValue,conditionsPass,type ComposerDocument,type ContentBlock } from "@/lib/composer";
export function ComposerRenderer({composer,context={},compact=false}:{composer:ComposerDocument;context?:Record<string,unknown>;compact?:boolean}){return <article className={`composer-document min-h-[297mm] ${compact?"p-4 text-[6px]":"p-[14mm] text-[10px]"}`}><div className="composer-grid">{composer.blocks.filter(v=>v.visible&&conditionsPass(v.conditions,context)).map(block=><Block key={block.id} block={block} context={context}/>)}</div></article>}
function Block({block,context}:{block:ContentBlock;context:Record<string,unknown>}){
 const bound=block.binding?bindingValue(block.binding,context):undefined,c=block.content,text=String(bound??c.text??c.value??"");
 const style:React.CSSProperties={textAlign:block.style.alignment,backgroundColor:block.style.backgroundColor,color:block.style.textColor,padding:block.style.padding,borderRadius:block.style.borderRadius,breakInside:block.pageBehavior.keepTogether?"avoid":"auto",gridColumn:width(block.layout.width),pageBreakBefore:block.pageBehavior.startOnNewPage?"always":"auto"};
 const cls=`composer-block composer-${block.type} composer-${block.style.variant}`;
 if(block.type==="document-title")return <h1 className={cls} style={style}>{text}</h1>;
 if(block.type==="subtitle")return <h2 className={cls} style={style}>{text}</h2>;
 if(["text","rich-text","terms","note","warning","legal","custom"].includes(block.type))return <section className={cls} style={style}>{Boolean(c.title)&&<h3>{String(c.title)}</h3>}<p className="whitespace-pre-wrap">{text}</p></section>;
 if(block.type==="field-value")return <dl className={cls} style={style}><dt>{String(c.label??"")}</dt><dd>{text}</dd></dl>;
 if(["company","customer","supplier","project"].includes(block.type))return <section className={cls} style={style}><h3>{String(c.title??block.name)}</h3>{Object.entries(c).filter(([k])=>k!=="title").map(([k,v])=><p key={k}><b>{k}:</b> {String(v)}</p>)}</section>;
 if(block.type==="divider")return <hr className={cls} style={style}/>;
 if(block.type==="spacer")return <div className={cls} style={{...style,height:Number(c.height??20)}}/>;
 if(block.type==="progress")return <section className={cls} style={style}><span>{String(c.label??"Napredak")}</span><div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-[var(--doc-accent)]" style={{width:`${Math.max(0,Math.min(100,Number(c.value??0)))}%`}}/></div></section>;
 if(block.type==="stat-card"||block.type==="status"||block.type==="financial-summary")return <section className={cls} style={style}><span>{String(c.label??c.title??block.name)}</span><strong className="block text-xl">{text||String(c.total??"")}</strong></section>;
 if(block.type==="items-table"||block.type==="table")return <TableBlock block={block} style={style}/>;
 if(block.type==="checklist")return <ul className={cls} style={style}>{((c.items as Array<{label:string;completed:boolean}>|undefined)??[]).map((v,i)=><li key={i}>{v.completed?"✓":"○"} {v.label}</li>)}</ul>;
 if(block.type==="image"&&Boolean(c.src))return <figure className={cls} style={style}><Image src={String(c.src)} alt={String(c.caption??"")} width={900} height={600} unoptimized className="h-auto max-h-[90mm] w-full object-contain"/><figcaption>{String(c.caption??"")}</figcaption></figure>;
 if(block.type==="signature")return <section className={cls} style={style}><div className="mt-12 border-t pt-2">{String(c.name??c.label??"Potpis")}<small className="block">{String(c.role??"")}</small></div></section>;
 if(block.children)return <section className={`${cls} grid gap-3`} style={{...style,gridTemplateColumns:`repeat(${block.layout.columns},minmax(0,1fr))`}}>{block.children.filter(v=>v.visible).map(v=><Block key={v.id} block={v} context={context}/>)}</section>;
 return <section className={cls} style={style}><b>{block.name}</b>{Boolean(text)&&<p>{text}</p>}</section>
}
function TableBlock({block,style}:{block:ContentBlock;style:React.CSSProperties}){const columns=(block.content.columns as string[]|undefined)??[],rows=(block.content.rows as unknown[][]|undefined)??[];return <table className={`composer-block composer-${block.type}`} style={style}><thead><tr>{columns.map((v,i)=><th key={i}>{v}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{String(cell)}</td>)}</tr>)}</tbody></table>}
function width(value:ContentBlock["layout"]["width"]){return value==="full"?"1 / -1":value==="half"?"span 6":value==="third"?"span 4":value==="quarter"?"span 3":value==="30"?"span 4":value==="40"?"span 5":value==="60"?"span 7":"span 8"}
