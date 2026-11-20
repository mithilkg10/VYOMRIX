"use client";

export function YamlView({ source }: { source: string }) {
  return (
    <pre className="terminal overflow-x-auto p-4 text-[12px] leading-[1.6]">
      {source.split("\n").map((line, i) => {
        const m = /^(\s*)(- )?([A-Za-z0-9_|.-]+)(:)(.*)$/.exec(line);
        return (
          <div key={i} className="whitespace-pre">
            {m ? (
              <>{m[1]}{m[2] && <span className="text-slate-500">{m[2]}</span>}<span className="text-cyan-300">{m[3]}</span><span className="text-slate-500">{m[4]}</span><span className={m[5].trim().startsWith("'") || m[5].trim().startsWith('"') ? "text-amber-200" : "text-emerald-200"}>{m[5]}</span></>
            ) : /^\s*- /.test(line) ? (
              <><span className="text-slate-500">{line.slice(0, line.indexOf("- ") + 2)}</span><span className="text-amber-200">{line.slice(line.indexOf("- ") + 2)}</span></>
            ) : line || " "}
          </div>
        );
      })}
    </pre>
  );
}
