import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { animationCaption, STORY_ANIMATIONS, type StoryAnimationScene } from '../utils/storyAnimations.ts';
import './StoryAnimation.css';

type StoryAnimationProps = {
  scene: StoryAnimationScene;
  bearName: string;
  onNarrate: (text: string) => void;
  onStopNarration: () => void;
  pauseToken?: number;
};

type Point = { x: number; y: number };
const colors = { fur: '#B87942', edge: '#744525', light: '#DDA56B', muzzle: '#F2D2A2', teal: '#14766F', dark: '#163835' };

function Bear({ arm = 0, otherArm = 0, head = 0, breathing = false, asleep = false, mouthOpen = false, gown = false, standing = false }: {
  arm?: number; otherArm?: number; head?: number; breathing?: boolean; asleep?: boolean; mouthOpen?: boolean; gown?: boolean; standing?: boolean;
}) {
  return <g stroke={colors.edge} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx="197" cy="263" rx="69" ry="9" fill="#D3DFD8" stroke="none" />
    <g className="story-art-motion" style={{ transform: `translate(197px, 188px) scale(${breathing ? 1.035 : 1}, ${breathing ? 1.025 : 1}) translate(-197px, -188px)` }}>
      <ellipse cx="197" cy="191" rx="49" ry="59" fill={colors.fur} />
      <path d="M156 168 Q197 178 238 168 L240 229 Q199 251 154 229Z" fill={gown ? '#D1E9F2' : colors.teal} stroke={gown ? '#5494A9' : '#0E5A54'} />
      {gown ? <g stroke="#5494A9" strokeWidth="1.7"><path d="M191 169L197 180 203 169M197 180V232" /><path d="M171 194h4m38 0h4m-46 20h4m38 0h4" /></g> : <>
        <path d="M166 152L172 183M227 152L221 183" stroke={colors.teal} strokeWidth="13" />
        <circle cx="174" cy="183" r="3.5" fill="#F6D991" stroke="none" /><circle cx="220" cy="183" r="3.5" fill="#F6D991" stroke="none" />
        <path d="M182 195H212V215Q197 223 182 215Z" fill="#D2E8DF" stroke="#0E5A54" />
        <path d="M197 212C184 204 191 198 197 203C203 198 210 204 197 212" fill="#DD785B" stroke="none" />
      </>}
    </g>
    <g className="story-art-motion" style={{ transform: `rotate(${arm}deg)`, transformOrigin: '157px 164px' }}>
      <path d="M155 158Q132 162 128 192L127 212Q138 224 151 213L166 177" fill={colors.fur} />
      <ellipse cx="139" cy="211" rx="14" ry="12" fill={colors.light} />
      <path d="M131 209l2 3m6-5v5m6-4-1 4" strokeWidth="1.5" />
    </g>
    <g className="story-art-motion" style={{ transform: `rotate(${otherArm}deg)`, transformOrigin: '237px 164px' }}>
      <path d="M238 158Q262 166 264 192L265 210Q253 224 241 211L228 178" fill={colors.fur} />
      <ellipse cx="253" cy="210" rx="14" ry="12" fill={colors.light} />
      <path d="M246 207l1 5m6-6v6m6-5-2 4" strokeWidth="1.5" />
    </g>
    {standing ? <g><path d="M169 230v30h23v-30m11 0v30h23v-30" fill={colors.teal} /><ellipse cx="179" cy="266" rx="18" ry="10" fill={colors.fur} /><ellipse cx="216" cy="266" rx="18" ry="10" fill={colors.fur} /></g> : <>
      <ellipse cx="163" cy="246" rx="25" ry="20" transform="rotate(-18 163 246)" fill={colors.fur} />
      <ellipse cx="230" cy="246" rx="25" ry="20" transform="rotate(18 230 246)" fill={colors.fur} />
      <ellipse cx="161" cy="249" rx="13" ry="10" fill={colors.muzzle} /><ellipse cx="232" cy="249" rx="13" ry="10" fill={colors.muzzle} />
    </>}
    <g className="story-art-motion" style={{ transform: `rotate(${head}deg)`, transformOrigin: '197px 132px' }}>
      <circle cx="157" cy="64" r="20" fill={colors.fur} /><circle cx="237" cy="64" r="20" fill={colors.fur} />
      <circle cx="157" cy="64" r="12" fill={colors.light} /><circle cx="237" cy="64" r="12" fill={colors.light} />
      <path d="M150 86Q151 60 181 53L190 48 194 54 203 49 208 55Q241 61 246 89Q255 122 232 139Q198 158 164 139Q140 123 150 86Z" fill={colors.fur} />
      <ellipse cx="197" cy="119" rx="29" ry="22" fill={colors.muzzle} stroke="none" />
      <path d="M169 83q6-5 11-1m34 0q6-4 11 2" fill="none" strokeWidth="2" />
      {asleep ? <path d="M169 98q6 5 12 0m32 0q6 5 12 0" fill="none" /> : <>
        <ellipse cx="176" cy="99" rx="5" ry="7" fill="#3E2B24" stroke="none" /><ellipse cx="219" cy="99" rx="5" ry="7" fill="#3E2B24" stroke="none" />
        <circle cx="177" cy="97" r="1.7" fill="white" stroke="none" /><circle cx="220" cy="97" r="1.7" fill="white" stroke="none" />
      </>}
      <path d="M190 111Q197 107 204 111Q204 117 197 119Q190 116 190 111" fill="#573927" stroke="none" />
      {mouthOpen ? <ellipse cx="204" cy="126" rx="7" ry="4" fill="#744525" stroke="none" /> : <path d="M197 118V124Q191 132 185 125M197 124Q204 132 210 125" fill="none" strokeWidth="2" />}
    </g>
  </g>;
}

function HelpingHand({ hand, handBack = false }: { hand: Point; handBack?: boolean }) {
  return <g className="story-art-motion" strokeWidth="2" strokeLinecap="round">
    <path className="story-art-motion" d={`M344 159 Q${hand.x + 55} ${hand.y + 43} ${hand.x + 12} ${hand.y + 2}`} fill="none" stroke="#496B6B" strokeWidth="23" />
    <path className="story-art-motion" d={`M344 159 Q${hand.x + 55} ${hand.y + 43} ${hand.x + 12} ${hand.y + 2}`} fill="none" stroke="#C1DFDD" strokeWidth="19" />
    <ellipse className="story-art-motion" cx={hand.x} cy={hand.y} rx="16" ry="10" fill="#D69D77" stroke="#98674B" transform={`rotate(${handBack ? 25 : -12} ${hand.x} ${hand.y})`} />
    <path className="story-art-motion" d={`M${hand.x - 8} ${hand.y - 3}l6 2m-5 3l6 2`} stroke="#98674B" strokeWidth="1.3" />
  </g>;
}

function Helper() {
  return <g stroke="#496B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M328 148Q361 126 390 151V258H331Z" fill="#C1DFDD" />
    <path d="M344 137L356 153 369 136" fill="#FAF6F0" />
    <rect x="361" y="169" width="17" height="22" rx="3" fill="white" />
    <path d="M366 175h7m-7 5h7" stroke="#85A4A0" strokeWidth="2" />
    <path d="M351 134V119H369V137Q361 145 351 134" fill="#C88D69" stroke="#98674B" />
    <ellipse cx="358" cy="98" rx="24" ry="29" fill="#D69D77" stroke="#98674B" />
    <path d="M334 95Q327 64 355 64Q384 61 384 91Q364 88 351 77Q346 90 334 95" fill="#4E3930" stroke="#4E3930" />
    <path d="M345 99h2m18 0h2m-16 14q6 4 12-1" stroke="#694B3A" />
  </g>;
}

function Clipboard({ x, y, checked = false }: Point & { checked?: boolean }) {
  return <g transform={`translate(${x} ${y})`} stroke="#0E5A54" strokeWidth="2" strokeLinecap="round">
    <rect width="38" height="51" rx="5" fill="#F5E4C2" /><rect x="5" y="7" width="28" height="38" rx="2" fill="white" stroke="none" />
    <rect x="12" y="-3" width="14" height="8" rx="3" fill="#8CC6BD" />
    <path d="M11 17h15m-15 9h15m-15 9h9" stroke="#9AB4AC" />
    {checked && <path d="M22 33l4 4 9-12" strokeWidth="3" fill="none" />}
  </g>;
}

function CuffScene({ step }: { step: number }) {
  const attached = step >= 1;
  const tight = step === 2;
  return <>
    <g transform="translate(400 0) scale(-1 1)"><Helper /></g>
    <rect x="115" y="221" width="47" height="13" rx="6" fill="#D8D0BB" stroke="#ADA38A" strokeWidth="2" />
    <path d="M124 233v26m28-26v26" stroke="#ADA38A" strokeWidth="4" />
    <Bear breathing={step === 3} />
    <g transform="translate(400 0) scale(-1 1)"><HelpingHand hand={{ x: attached ? 240 : 296, y: 174 }} /></g>
    <g className="story-art-motion" style={{ transform: `translateX(${attached ? 0 : -53}px)` }}>
      <path className="story-art-motion" d={attached ? `M127 159Q139 ${tight ? 154 : 153} 155 160L158 188Q142 ${tight ? 194 : 198} 125 190Z` : 'M125 159H159V190H125Z'} fill={tight ? '#6789B4' : '#9AB4D6'} stroke="#42618A" strokeWidth="2.5" />
      <path className="story-art-motion" d={attached ? 'M149 160Q165 164 153 186L144 187L146 162Z' : 'M159 159L177 164V188L159 190Z'} fill="#B7CAE3" stroke="#42618A" strokeWidth="2" />
      <path d="M150 162L152 185M130 165l13-2" fill="none" stroke="#DCE7F4" strokeWidth="3" strokeLinecap="round" />
      {!attached && <path d="M126 160Q113 171 124 190" fill="none" stroke="#42618A" strokeWidth="3" />}
    </g>
    {attached && <path d="M129 188C103 200 124 233 100 229L98 223" fill="none" stroke="#42618A" strokeWidth="3.5" />}
    {attached && <g transform="translate(56 201)" stroke="#67879D" strokeWidth="2">
      <rect width="45" height="42" rx="7" fill="#F4F8F5" /><rect className="story-art-motion" x="6" y="7" width="31" height="19" rx="3" fill={tight ? '#B5D8CD' : '#E0EAE4'} />
      <path d={tight ? 'M10 18h5l4-6 5 11 5-7 5 2' : 'M10 18h24'} fill="none" stroke="#527B71" strokeWidth="1.5" />
      <circle cx="33" cy="34" r="3" fill="#A4C8BB" /><path d="M4 43h37" strokeWidth="3" strokeLinecap="round" />
    </g>}
    {step === 3 && <path d="M164 164q9 10 0 20" fill="none" stroke="#75A29A" strokeWidth="2" strokeDasharray="3 4" />}
  </>;
}

function IVScene({ step, clipId }: { step: number; clipId: string }) {
  const connected = step >= 2;
  const tubePath = connected ? 'M307 128V190Q309 229 280 225L253 211' : 'M307 128V171Q307 197 295 197';
  return <>
    <Helper />
    <path d="M302 38H324V247M304 247H343M324 246l-18 16m18-16 17 16" fill="none" stroke="#8CA3A2" strokeWidth="5" strokeLinecap="round" />
    <circle cx="306" cy="263" r="5" fill="#587675" /><circle cx="341" cy="263" r="5" fill="#587675" />
    <path d="M307 37v13" stroke="#587675" strokeWidth="3" />
    <rect x="291" y="49" width="32" height="52" rx="7" fill="#F6FDFF" stroke="#6CA0B0" strokeWidth="2" />
    <clipPath id={clipId}><rect x="294" y="53" width="26" height="44" rx="5" /></clipPath>
    <g clipPath={`url(#${clipId})`}><rect className="story-art-motion" x="294" y={step >= 2 ? 66 : 60} width="26" height="40" fill="#B3DFE9" /><path d="M294 67Q302 62 310 67T325 67" fill="none" stroke="#83C5D5" /></g>
    <path d="M307 101v14" stroke="#6CA0B0" strokeWidth="4" /><rect x="302" y="112" width="10" height="16" rx="4" fill="#E7F8FC" stroke="#6CA0B0" strokeWidth="2" />
    <Bear breathing={step === 3} />
    {(step === 1 || step === 2) && <HelpingHand hand={{ x: 265, y: 213 }} />}
    {step >= 1 && <rect x="244" y="203" width="24" height="15" rx="5" transform="rotate(16 256 210)" fill={connected ? '#F4FAF8' : '#F3EEE5'} fillOpacity={connected ? .65 : 1} stroke="#B1C8C1" strokeWidth="2" />}
    <path className="story-art-motion" d={tubePath} fill="none" stroke="#75AAB8" strokeWidth="3" />
    {connected ? <path d="M252 211l9 3" stroke="#75AAB8" strokeWidth="3" strokeLinecap="round" /> : <rect x="291" y="193" width="7" height="7" rx="2" fill="#5A8F9C" />}
    {step >= 2 && <circle cx="307" cy="121" r="2.3" fill="#509EB4" />}
    {step === 3 && <g><path d="M78 118h42q7 0 7 7v20q0 7-7 7h-17l-10 10v-10H78q-7 0-7-7v-20q0-7 7-7Z" fill="white" stroke="#87B0A6" strokeWidth="2" /><path d="M85 133h29m-29 8h18" stroke="#0E5A54" strokeWidth="2" /></g>}
  </>;
}

function MaskScene({ step }: { step: number }) {
  const x = step === 0 ? 278 : 197;
  const y = step === 0 ? 191 : 120;
  return <>
    <Helper />
    <Bear breathing={step === 2} asleep={step === 3} />
    <HelpingHand hand={{ x: x + 24, y: y + 4 }} />
    <g stroke="#6C9490" strokeWidth="2" strokeLinejoin="round">
      <rect x="304" y="210" width="63" height="52" rx="8" fill="#EEF5EF" />
      <rect x="318" y="219" width="37" height="19" rx="4" fill="#BDDAD1" />
      <path d="M323 229h7l4-5 5 8 5-4h6" fill="none" stroke="#6C9490" strokeWidth="1.5" />
      <circle cx="346" cy="250" r="4" fill="#8EB9AA" /><path d="M313 263v9m44-9v9" strokeWidth="4" strokeLinecap="round" />
      <circle cx="308" cy="239" r="7" fill="#6C9490" />
    </g>
    <path className="story-art-motion" d={`M${x} ${y + 22}Q${x + 15} ${y + 63} 308 239`} fill="none" stroke="#79AAA6" strokeWidth="9" />
    <path className="story-art-motion" d={`M${x} ${y + 22}Q${x + 15} ${y + 63} 308 239`} fill="none" stroke="#B5D7D2" strokeWidth="5" />
    <g className="story-art-motion" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <path d="M0-21Q-16-16-22 5Q-23 20 0 22Q23 20 22 5Q16-16 0-21Z" fill="#D5F3EF" fillOpacity=".72" stroke="#639F99" strokeWidth="3" />
      <ellipse cy="13" rx="7" ry="6" fill="#F6FFFD" stroke="#639F99" strokeWidth="2" />
      <path d="M-13-5q-5 9-3 13" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </g>
    {step === 2 && <path d="M166 174Q197 169 227 174" fill="none" stroke="#84BBB0" strokeWidth="3" />}
  </>;
}

function MedicineScene({ step }: { step: number }) {
  const atCheek = step === 2;
  const x = atCheek ? 210 : 275;
  const y = atCheek ? 126 : 206;
  return <>
    <Helper />
    <Bear mouthOpen={atCheek} head={step === 3 ? 3 : 0} />
    <HelpingHand hand={{ x: x + 40, y: y + 4 }} />
    <Clipboard x={69} y={178} checked={step >= 1} />
    <g transform="translate(108 211)" stroke="#7E9D91" strokeWidth="2"><rect width="24" height="37" rx="5" fill="#D7A267" /><rect x="4" y="-6" width="16" height="8" rx="2" fill="#EFE6D7" /><rect x="3" y="10" width="18" height="17" rx="2" fill="#F7F3E8" /><path d="M7 15h10m-10 5h10" strokeWidth="1.5" /></g>
    <g className="story-art-motion" style={{ transform: `translate(${x}px, ${y}px) rotate(${atCheek ? -7 : -27}deg)` }} stroke="#4C8190" strokeWidth="2" strokeLinejoin="round">
      {/* A blunt, needle-free oral syringe held by the grown-up. */}
      <path d="M0-2H10V2H0Z" fill="#D3EAF0" /><rect x="10" y="-7" width="37" height="14" rx="3" fill="#F9FEFF" />
      <rect className="story-art-motion" x="12" y="-4.5" width={step >= 2 ? 10 : 22} height="9" rx="1" fill="#E9B788" stroke="none" />
      <path d="M47-11V11" strokeWidth="3" /><path className="story-art-motion" d={`M${step >= 2 ? 25 : 35} 0H${step >= 2 ? 51 : 61}M${step >= 2 ? 51 : 61}-8V8`} strokeWidth="4" />
      <path d="M20-7v4m10-4v4m10-4v4" strokeWidth="1.4" />
    </g>
    {step === 3 && <path d="M192 150q6 5 12 0" fill="none" stroke="#9D7048" strokeWidth="2" />}
  </>;
}

function OtherScene({ scene, step }: { scene: StoryAnimationScene; step: number }) {
  const touching = step === 1 || step === 2;
  const doctorScene = ['thermometer', 'stethoscope', 'measure', 'gown', 'helper', 'vitals', 'ask', 'tell', 'rest', 'sip', 'snack'].includes(scene);
  return <>
    {doctorScene && <Helper />}
    {scene === 'rest' && <g stroke="#B5A381" strokeWidth="2"><rect x="132" y="139" width="133" height="112" rx="24" fill="#D8CCB0" /><rect x="116" y="194" width="27" height="62" rx="12" fill="#E4D8BF" /><rect x="253" y="194" width="27" height="62" rx="12" fill="#E4D8BF" /><rect x="145" y="248" width="104" height="14" rx="6" fill="#C6B899" /></g>}
    <Bear breathing={['breathing', 'stethoscope', 'rest'].includes(scene) && step === 2} asleep={scene === 'rest' && step === 3} mouthOpen={(scene === 'snack' || scene === 'sip') && step === 2} gown={scene === 'gown' && step >= 1} standing={scene === 'measure' && step >= 1} otherArm={scene === 'sip' && touching ? 165 : scene === 'tell' && step >= 1 ? 130 : 0} head={scene === 'ask' && step === 2 ? -5 : 0} />
    {scene === 'thermometer' && <HelpingHand hand={{ x: touching ? 252 : 303, y: touching ? 79 : 193 }} />}
    {scene === 'stethoscope' && <HelpingHand hand={{ x: touching ? 215 : 291, y: touching ? 166 : 208 }} />}
    {scene === 'thermometer' && <g className="story-art-motion" style={{ transform: `translate(${touching ? 224 : 274}px, ${touching ? 77 : 189}px) rotate(-15deg)` }}>
      <rect width="31" height="10" rx="5" fill="white" stroke="#749B9A" strokeWidth="2" /><rect x="12" y="2" width="9" height="5" rx="1" fill="#B8DCD5" />
      {step === 2 && <path d="M32-4q6 6 0 12m5-16q10 10 0 20" fill="none" stroke="#4C9486" strokeWidth="2" />}
    </g>}
    {scene === 'stethoscope' && <>
      <path className="story-art-motion" d={`M344 121Q327 152 339 191Q317 224 ${touching ? 203 : 279} ${touching ? 171 : 211}`} fill="none" stroke="#496B6B" strokeWidth="4" />
      <path d="M344 121Q333 115 337 102M344 121Q373 132 378 103" fill="none" stroke="#8FA5A5" strokeWidth="3" />
      <path d="M337 99v5m41-4v5" stroke="#496B6B" strokeWidth="4" strokeLinecap="round" />
      <circle className="story-art-motion" cx={touching ? 201 : 279} cy={touching ? 169 : 211} r="12" fill="#C8DADD" stroke="#496B6B" strokeWidth="3" />
      <circle className="story-art-motion" cx={touching ? 201 : 279} cy={touching ? 169 : 211} r="6" fill="#EAF5F3" />
      {step === 3 && <path d="M61 159h12l7-12 8 25 9-18 8 5h20" fill="none" stroke="#D37C63" strokeWidth="3" strokeLinecap="round" />}
    </>}
    {scene === 'measure' && <>
      <path d="M104 55V247M104 67h13m-13 20h8m-8 20h13m-13 20h8m-8 20h13m-13 20h8m-8 20h13m-13 20h8m-8 20h13" stroke="#B99A6F" strokeWidth="3" />
      <path className="story-art-motion" d={`M104 ${step >= 2 ? 47 : 32}H212`} stroke="#B99A6F" strokeWidth="5" strokeLinecap="round" />
      <rect x="141" y="277" width="112" height="10" rx="4" fill="#D7E9E5" stroke="#779D94" strokeWidth="2" />
      {step >= 2 && <Clipboard x={278} y={199} checked={step === 3} />}
    </>}
    {scene === 'gown' && <>
      <g className="story-art-motion" style={{ opacity: step < 2 ? 1 : 0.35 }}><path d="M72 168l17-8 17 8 11 22-13 6-4-9v48H77v-48l-4 9-13-6Z" fill="#D8EAF1" stroke="#6A9CAA" strokeWidth="2" /><path d="M82 164q7 10 14 0" fill="none" stroke="#6A9CAA" strokeWidth="2" /></g>
      <path d="M278 212h43v45h-43Z" fill="#D5B996" stroke="#9F805B" strokeWidth="2" /><path d="M287 214v-9q12-16 24 0v9" fill="none" stroke="#9F805B" strokeWidth="3" />
      {step >= 2 && <path d="M288 224h23v10h-23Z" fill="white" stroke="#9F805B" />}
      {step === 1 && <g stroke="#7C9C94" strokeWidth="3"><path d="M119 39v232m157-232v232" /><path d="M119 48H276V258H119Z" fill="#D8E6DB" /><path d="M145 49v208m26-208v208m26-208v208m26-208v208m26-208v208" stroke="#B9CEC1" strokeWidth="2" /><circle cx="119" cy="273" r="4" fill="#7C9C94" /><circle cx="276" cy="273" r="4" fill="#7C9C94" /></g>}
    </>}
    {scene === 'breathing' && <>
      <g className="story-art-motion" style={{ transform: `translate(87px, 161px) scale(${step === 1 ? 1.25 : step === 2 ? 0.85 : 1})` }}><circle r="33" fill="#C8E6DE" stroke="#6DAE9E" strokeWidth="2" /><path d="M-19 0q19-20 38 0M-19 9q19-20 38 0" fill="none" stroke="#6DAE9E" strokeWidth="2" /></g>
      <path d="M280 179q18-17 35-1m-35 11q18-17 35-1" fill="none" stroke="#9FCBC0" strokeWidth="3" />
    </>}
    {(scene === 'helper' || scene === 'ask' || scene === 'tell') && <>
      <g className="story-art-motion" style={{ opacity: step >= 1 ? 1 : 0 }}><path d="M59 86h58q9 0 9 9v28q0 9-9 9H92l-12 13v-13H59q-9 0-9-9V95q0-9 9-9Z" fill="white" stroke="#87B0A6" strokeWidth="2" /><path d={scene === 'helper' ? 'M72 102h35m-35 10h25' : 'M82 101q0-8 9-8 12 1 6 10l-6 6v5m0 7v1'} fill="none" stroke="#0E5A54" strokeWidth="3" strokeLinecap="round" /></g>
      {step >= 2 && <g transform="translate(362 170)"><rect width="18" height="22" rx="3" fill="white" stroke="#0E5A54" strokeWidth="2" /><circle cx="9" cy="7" r="3" fill="#D69D77" /><path d="M4 15h10" stroke="#0E5A54" strokeWidth="2" /></g>}
      {scene === 'ask' && <g transform="translate(288 218)" stroke="#6A93A8" strokeWidth="2"><path d="M0 0q13-7 27 0v24q-13 7-27 0Z" fill="#ABC3DC" /><path d="M4 24q-7 13 10 16" fill="none" /></g>}
      {step === 3 && <HelpingHand hand={{ x: 268, y: 210 }} />}
    </>}
    {scene === 'vitals' && <>
      {step === 0 && <><HelpingHand hand={{ x: 252, y: 79 }} /><g transform="translate(222 77) rotate(-15)"><rect width="31" height="10" rx="5" fill="white" stroke="#749B9A" strokeWidth="2" /><rect x="12" y="2" width="9" height="5" fill="#B8DCD5" /></g></>}
      {step === 1 && <><HelpingHand hand={{ x: 215, y: 166 }} /><path d="M344 121Q333 115 337 102M344 121Q373 132 378 103" fill="none" stroke="#8FA5A5" strokeWidth="3" /><path d="M344 121Q327 152 339 191Q317 224 203 171" fill="none" stroke="#496B6B" strokeWidth="4" /><circle cx="201" cy="169" r="12" fill="#C8DADD" stroke="#496B6B" strokeWidth="3" /></>}
      {step === 2 && <><path d="M127 159Q139 153 155 160L158 188Q142 198 125 190Z" fill="#9AB4D6" stroke="#42618A" strokeWidth="2.5" /><path d="M129 188Q101 222 84 221" fill="none" stroke="#42618A" strokeWidth="3" /><ellipse cx="77" cy="221" rx="10" ry="15" fill="#6789B4" /></>}
      {step === 3 && <><Clipboard x={276} y={193} checked /><HelpingHand hand={{ x: 302, y: 215 }} /><path d="M294 221l20-19" stroke="#D49A4F" strokeWidth="4" strokeLinecap="round" /></>}
    </>}
    {scene === 'rest' && <>
      <rect x="61" y="195" width="64" height="43" rx="12" fill="#E9CFAD" stroke="#C3A17D" strokeWidth="2" />
      {step >= 2 && <g transform="translate(170 210)" stroke="#8DAD9E" strokeWidth="2"><path d="M0 0H55L62 35H-6Z" fill="#FFFDF6" /><path d="M8 24l8-16 8 16Zm27-13q13 0 10 14H28" fill="none" stroke="#6FAD9D" /><path className="story-art-motion" d={step === 2 ? 'M39 3L55-15' : 'M45 25L61 8'} stroke="#D9A254" strokeWidth="5" strokeLinecap="round" /></g>}
    </>}
    {scene === 'sip' && <g className="story-art-motion" style={{ transform: `translate(${touching ? 213 : 273}px, ${touching ? 126 : 218}px) rotate(${step === 2 ? -24 : 0}deg)` }} stroke="#5A93A0" strokeWidth="2"><path d="M-10 0h28l-3 31h-22Z" fill="#D3ECF0" /><path d="M-7 15H15L13 28H-5Z" fill="#90CBD6" stroke="none" /><path d="M18 5q17-2 11 15l-13 4" fill="none" /><path d="M-9 0q14 4 27 0" fill="none" /></g>}
    {scene === 'snack' && <>
      <path d="M278 224h46l-6 29h-34Z" fill="#D7E7DC" stroke="#92AEA2" strokeWidth="2" /><ellipse cx="301" cy="224" rx="23" ry="6" fill="#F9F0EF" stroke="#C9BDBA" strokeWidth="2" />
      <HelpingHand hand={{ x: step === 2 ? 254 : 315, y: step === 2 ? 132 : 211 }} />
      <g className="story-art-motion" style={{ transform: `translate(${step === 2 ? 220 : 282}px, ${step === 2 ? 128 : 212}px)` }} stroke="#8B9E9B" strokeWidth="3" strokeLinecap="round"><path d="M7 0H43" /><ellipse rx="10" ry="4" fill="#E4EAE6" /><ellipse cy="-1.5" rx="7" ry="2.5" fill="#F9F0EF" stroke="none" /></g>
    </>}
    {['sip', 'snack'].includes(scene) && step === 0 && <Clipboard x={69} y={178} checked />}
  </>;
}

export function StoryAnimation({ scene, bearName, onNarrate, onStopNarration, pauseToken = 0 }: StoryAnimationProps) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stableId = useId().replace(/:/g, '');
  const stopNarrationRef = useRef(onStopNarration);
  stopNarrationRef.current = onStopNarration;
  const animation = STORY_ANIMATIONS[scene];
  const currentStep = animation.steps[step];
  const substitute = (text: string) => animationCaption(text, bearName);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
    stopNarrationRef.current();
  }, [scene]);

  // External page narration pauses the picture without cancelling its new voice.
  useEffect(() => {
    setPlaying(false);
  }, [pauseToken]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) {
        setPlaying(false);
        stopNarrationRef.current();
      }
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      stopNarrationRef.current();
    };
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (step >= animation.steps.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, step, animation.steps.length]);

  const goTo = (next: number) => {
    stopNarrationRef.current();
    setPlaying(false);
    setStep(Math.max(0, Math.min(animation.steps.length - 1, next)));
  };
  const togglePlay = () => {
    stopNarrationRef.current();
    if (reducedMotion) { goTo(step >= animation.steps.length - 1 ? 0 : step + 1); return; }
    if (!playing && step >= animation.steps.length - 1) setStep(0);
    setPlaying(!playing);
  };

  return <section className={`story-animation ${reducedMotion ? 'story-animation--reduced' : ''}`} aria-labelledby={`${stableId}-title`}>
    <div className="story-animation-heading">
      <span className="story-animation-eyebrow">Watch it happen</span>
      <h3 id={`${stableId}-title`}>{substitute(animation.title)}</h3>
    </div>
    <div className="story-animation-stage">
      <svg viewBox="0 0 400 290" role="img" aria-labelledby={`${stableId}-art-title ${stableId}-art-description`}>
        <title id={`${stableId}-art-title`}>{substitute(currentStep.title)}</title>
        <desc id={`${stableId}-art-description`}>{substitute(currentStep.caption)}</desc>
        <rect width="400" height="290" rx="24" fill="#F5F2E9" />
        <path d="M0 241Q204 227 400 241V290H0Z" fill="#E4EBE2" />
        <rect x="21" y="25" width="71" height="64" rx="12" fill="#E4EEEA" stroke="#D0E0D7" strokeWidth="2" />
        <path d="M57 26v62M22 57h69" stroke="#D0E0D7" strokeWidth="2" />
        {scene === 'cuff' ? <CuffScene step={step} />
          : scene === 'iv' ? <IVScene step={step} clipId={`${stableId}-iv`} />
          : scene === 'mask' ? <MaskScene step={step} />
          : scene === 'medicine' ? <MedicineScene step={step} />
          : <OtherScene scene={scene} step={step} />}
      </svg>
    </div>
    <div className="story-animation-step" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
      <p className="story-animation-count">Step {step + 1} of {animation.steps.length}</p>
      <h4>{substitute(currentStep.title)}</h4>
      <p>{substitute(currentStep.caption)}</p>
    </div>
    <div className="story-animation-progress" aria-hidden="true">{animation.steps.map((_, i) => <span key={i} className={i <= step ? 'is-complete' : ''} />)}</div>
    <div className="story-animation-controls">
      <button type="button" className="story-animation-play" onClick={togglePlay} aria-label={reducedMotion ? (step === animation.steps.length - 1 ? 'Start the steps again' : 'Show the next step') : (playing ? 'Pause animation' : step === animation.steps.length - 1 ? 'Play animation again' : 'Play animation')}>
        {playing ? <Pause size={18} aria-hidden="true" /> : reducedMotion ? <ArrowRight size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        {reducedMotion ? (step === animation.steps.length - 1 ? 'Start again' : 'Next step') : playing ? 'Pause' : step === animation.steps.length - 1 ? 'Play again' : 'Play'}
      </button>
      <button type="button" onClick={() => { setPlaying(false); stopNarrationRef.current(); onNarrate(`${substitute(currentStep.title)}. ${substitute(currentStep.caption)}`); }}><Volume2 size={18} aria-hidden="true" />Listen</button>
      <button type="button" onClick={() => { stopNarrationRef.current(); setStep(0); setPlaying(!reducedMotion); }} aria-label="Replay animation from the first step"><RotateCcw size={18} aria-hidden="true" />Replay</button>
    </div>
    <div className="story-animation-navigation">
      <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0}><ArrowLeft size={18} aria-hidden="true" />Back</button>
      <span>{reducedMotion ? 'Move through at your pace' : 'Pause or take one step at a time'}</span>
      <button type="button" onClick={() => goTo(step + 1)} disabled={step === animation.steps.length - 1}>Next<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </section>;
}
