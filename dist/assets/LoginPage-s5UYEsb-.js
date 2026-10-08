import{c as r,r as s,u as y,j as e,m as w,C as j,I as m,B as b,a as v}from"./index-Cxa9DmMi.js";import{u as k}from"./useAuth-BkLY_O5k.js";import"./supabase-SU9mistK.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=r("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=r("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=r("Volume2",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]]),E=()=>{const[t,x]=s.useState(""),[n,u]=s.useState(""),[i,c]=s.useState(!1),[o,l]=s.useState(null),{signIn:h}=k(),g=y(),p=async a=>{if(a.preventDefault(),!t||!n){l("Please enter both email and password.");return}c(!0),l(null);try{await h(t,n),v.success("Signed in successfully."),g("/admin")}catch(d){const f=d instanceof Error?d.message:"Sign in failed.";l(f)}finally{c(!1)}};return e.jsx("div",{className:"min-h-screen flex items-center justify-center p-4 pt-safe pb-safe px-safe",children:e.jsx(w.div,{initial:{opacity:0,y:16},animate:{opacity:1,y:0},transition:{duration:.35,ease:[.22,1,.36,1]},className:"w-full max-w-sm",children:e.jsxs(j,{variant:"glass",className:"p-8 flex flex-col gap-6",children:[e.jsxs("div",{className:"flex flex-col items-center text-center gap-2",children:[e.jsx("div",{className:"w-12 h-12 rounded-hero bg-accent text-accent-ink flex items-center justify-center mb-2 shadow-lg shadow-accent/20",children:e.jsx(L,{className:"w-6 h-6"})}),e.jsx("h1",{className:"text-2xl font-bold tracking-tight text-fg",children:"Admin Inbox"}),e.jsx("p",{className:"text-xs text-fg-2",children:"Sign in to manage client voice feedback"})]}),e.jsxs("form",{onSubmit:p,className:"flex flex-col gap-4",children:[e.jsx(m,{type:"email",label:"Admin email",placeholder:"admin@example.com",value:t,onChange:a=>x(a.target.value),disabled:i,icon:e.jsx(S,{className:"w-4 h-4"})}),e.jsx(m,{type:"password",label:"Password",placeholder:"••••••••",value:n,onChange:a=>u(a.target.value),disabled:i,icon:e.jsx(N,{className:"w-4 h-4"})}),o&&e.jsx("div",{className:"p-3 bg-danger/10 border border-danger/20 rounded-control text-xs text-danger text-center",children:o}),e.jsx(b,{type:"submit",variant:"primary",size:"lg",loading:i,className:"w-full mt-2",children:"Sign In"})]})]})})})};export{E as LoginPage};
