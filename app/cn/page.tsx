import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "盛恒餐饮投资集团有限公司 | MaMa Zainab 品牌所有者",
  description:
    "盛恒餐饮投资集团有限公司是 MaMa Zainab 品牌的合法所有人，由王盛恒先生创立并运营。技术支持：SinAI Inc.",
};

// Chinese system font stack — renders correctly on Windows, macOS, and Linux
const CH =
  "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','SimHei','Noto Sans SC',sans-serif";

const CERT_ROWS: [string, string][] = [
  ["品牌名称", "MaMa Zainab（妈妈赛纳卜）"],
  ["品牌所有人", "王盛恒先生  Mr. Sheng Heng Wang"],
  ["所有人国籍", "中华人民共和国"],
  ["法人注册地", "中国"],
  ["授权运营地区", "埃及 · 亚历山大  Alexandria, Egypt"],
  ["数字技术服务商", "SinAI Inc. — sinai-inc.com"],
  ["授权年份", "2026 年至今"],
];

export default function ChineseOwnerPage() {
  return (
    <div
      style={{ fontFamily: CH }}
      className="min-h-screen bg-white text-gray-900 leading-relaxed"
    >
      {/* ══════════════════════════════════════════
          HEADER — Deep Red / Gold
      ══════════════════════════════════════════ */}
      <header
        className="relative text-white text-center py-20 px-6 overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg,#7B0000 0%,#CC0000 45%,#8B1C1C 100%)",
        }}
      >
        {/* Grid watermark overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,200,0,0.08) 28px,rgba(255,200,0,0.08) 29px)," +
              "repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,200,0,0.08) 28px,rgba(255,200,0,0.08) 29px)",
          }}
        />

        {/* Company Seal */}
        <div
          className="relative mx-auto mb-7 flex flex-col items-center justify-center"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "3px double #FFD700",
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontSize: 34, fontWeight: 900, color: "#FFD700", lineHeight: 1 }}>
            盛恒
          </span>
          <span
            style={{ fontSize: 9, color: "#FFD700", letterSpacing: "0.35em", marginTop: 4 }}
          >
            集&nbsp;团
          </span>
        </div>

        {/* Company Name */}
        <h1
          className="relative"
          style={{
            fontSize: "clamp(20px,4vw,36px)",
            fontWeight: 900,
            letterSpacing: "0.14em",
            color: "#FFD700",
          }}
        >
          盛恒餐饮投资集团有限公司
        </h1>
        <p
          className="relative mt-2"
          style={{
            fontSize: "clamp(9px,1.4vw,13px)",
            letterSpacing: "0.3em",
            color: "rgba(255,220,100,0.8)",
          }}
        >
          SHENG HENG CATERING INVESTMENT GROUP CO., LTD.
        </p>

        {/* Divider */}
        <div
          className="relative mx-auto my-6"
          style={{ width: 64, height: 2, background: "#FFD700" }}
        />

        <p
          className="relative"
          style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em" }}
        >
          MaMa Zainab&nbsp;品牌合法所有权声明
        </p>
      </header>

      {/* ══════════════════════════════════════════
          OWNERSHIP DECLARATION — White
      ══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#8B0000",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #CC0000",
            paddingBottom: 10,
            marginBottom: 18,
          }}
        >
          品牌所有权声明
        </h2>

        <p style={{ fontSize: 15, color: "#333", lineHeight: 2, marginBottom: 28 }}>
          本公司特此正式声明：
          <strong style={{ color: "#8B0000" }}>
            MaMa Zainab（妈妈赛纳卜）
          </strong>
          餐饮品牌由本集团创始人
          <strong style={{ color: "#8B0000" }}>王盛恒先生</strong>
          全权拥有及运营，品牌适用范围覆盖中东、北非等相关市场，授权经营地点包括埃及亚历山大市。
          本集团拥有该品牌的全部知识产权、商标权及运营权，任何未经授权的使用均属侵权行为，
          本公司将依法追究相关责任。
        </p>

        {/* Certificate Box */}
        <div
          style={{
            border: "2px solid #CC0000",
            borderRadius: 8,
            padding: "32px 28px 28px",
            background: "#FFF9F9",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Badge tab */}
          <div
            style={{
              position: "absolute",
              top: -1,
              left: 24,
              background: "#CC0000",
              color: "#FFD700",
              padding: "4px 18px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
            }}
          >
            品&nbsp;牌&nbsp;授&nbsp;权&nbsp;证&nbsp;明
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 18 }}>
            <tbody>
              {CERT_ROWS.map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid rgba(204,0,0,0.12)" }}>
                  <td
                    style={{
                      padding: "11px 14px 11px 0",
                      fontWeight: 700,
                      color: "#8B0000",
                      whiteSpace: "nowrap",
                      width: "36%",
                      verticalAlign: "top",
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "11px 0", color: "#333" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Watermark stamp */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: 12,
              right: 18,
              opacity: 0.06,
              fontSize: 90,
              color: "#CC0000",
              fontWeight: 900,
              transform: "rotate(-22deg)",
              pointerEvents: "none",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            盛恒
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT — Red background
      ══════════════════════════════════════════ */}
      <section
        className="py-16 px-6 text-white"
        style={{ background: "linear-gradient(135deg,#9B1C1C 0%,#CC0000 100%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#FFD700",
              borderBottom: "2px solid #FFD700",
              paddingBottom: 10,
              marginBottom: 24,
            }}
          >
            关于本集团
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3
                style={{ fontSize: 15, fontWeight: 700, color: "#FFD700", marginBottom: 10 }}
              >
                集团使命
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 2.1 }}>
                盛恒餐饮投资集团专注于全球餐饮品牌的创建与运营，
                以将正宗家常美食带到世界各地为使命，促进文化交流与饮食融合，
                让每一位顾客都能感受到家的味道。
              </p>
            </div>
            <div>
              <h3
                style={{ fontSize: 15, fontWeight: 700, color: "#FFD700", marginBottom: 10 }}
              >
                品牌战略
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 2.1 }}>
                MaMa Zainab 作为集团旗下首个中东系列餐饮品牌，
                致力于以快餐形式还原埃及家常菜的原汁原味，
                开创全新的异域饮食消费体验，面向埃及本土及海外市场拓展。
              </p>
            </div>
          </div>

          {/* Key facts strip */}
          <div
            className="mt-10 grid grid-cols-3 gap-4 text-center"
            style={{ borderTop: "1px solid rgba(255,200,0,0.3)", paddingTop: 24 }}
          >
            {[
              ["创始人", "王盛恒先生"],
              ["首营市场", "埃及·亚历山大"],
              ["数字支持", "SinAI Inc."],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#FFD700" }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: "0.1em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TECHNOLOGY & CONTACT — White
      ══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#8B0000",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #CC0000",
            paddingBottom: 10,
            marginBottom: 24,
          }}
        >
          技术合作与联系
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div>
            <h3
              style={{ fontSize: 14, fontWeight: 700, color: "#8B0000", marginBottom: 10 }}
            >
              官方数字技术合作伙伴
            </h3>
            <a
              href="https://sinai-inc.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#CC0000", fontWeight: 700, fontSize: 16, textDecoration: "underline" }}
            >
              SinAI Inc.
            </a>
            <p style={{ fontSize: 13, color: "#555", marginTop: 8, lineHeight: 1.9 }}>
              负责品牌全面数字化建设，涵盖官方网站、线上订购应用程序、
              行政管理后台系统及人工智能品牌资产生成服务。
            </p>
          </div>
          <div>
            <h3
              style={{ fontSize: 14, fontWeight: 700, color: "#8B0000", marginBottom: 10 }}
            >
              品牌授权与法律咨询
            </h3>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.9 }}>
              如需了解品牌授权、合作加盟及相关法律事宜，
              请通过正式渠道与本集团法定代表人联系。
            </p>
            <p style={{ fontSize: 13, color: "#8B0000", fontWeight: 700, marginTop: 8 }}>
              法定代表人：王盛恒先生
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — Dark Red
      ══════════════════════════════════════════ */}
      <footer
        className="text-center px-6 py-10"
        style={{
          background: "#6B0000",
          color: "rgba(255,210,180,0.7)",
          fontSize: 12,
          letterSpacing: "0.08em",
          lineHeight: 2.2,
        }}
      >
        <p style={{ color: "#FFD700", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          盛恒餐饮投资集团有限公司
        </p>
        <p>版权所有 © 2026 · 王盛恒 所有及运营 · 保留所有权利</p>
        <p>
          技术支持：{" "}
          <a
            href="https://sinai-inc.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#FFD700", textDecoration: "underline" }}
          >
            SinAI Inc.
          </a>
        </p>
        <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,200,0,0.15)", paddingTop: 14 }}>
          <Link
            href="/coming-soon"
            style={{ color: "rgba(255,190,140,0.5)", fontSize: 11 }}
          >
            ← 返回 MaMa Zainab 官网
          </Link>
        </div>
      </footer>
    </div>
  );
}
