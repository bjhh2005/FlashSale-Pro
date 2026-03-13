function getValue(id) {
  const el = document.getElementById(id);
  return (el?.value ?? "").trim();
}

function setOutput(obj) {
  const output = document.getElementById("output");
  if (!output) return;
  output.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

async function postJson(path, payload) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: res.status, ok: res.ok, data };
}

async function register() {
  const username = getValue("username");
  const password = getValue("password");
  if (!username || !password) {
    setOutput("请输入用户名和密码。");
    return;
  }
  setOutput("请求中…");
  const result = await postJson("/api/user/register", { username, password });
  setOutput(result);
}

async function login() {
  const username = getValue("username");
  const password = getValue("password");
  if (!username || !password) {
    setOutput("请输入用户名和密码。");
    return;
  }
  setOutput("请求中…");
  const result = await postJson("/api/user/login", { username, password });
  setOutput(result);
}

function initDefaults() {
  const u = document.getElementById("username");
  const p = document.getElementById("password");
  if (u && !u.value) u.value = "shangsan";
  if (p && !p.value) p.value = "my_password_123";
}

function wire() {
  document.getElementById("btnRegister")?.addEventListener("click", register);
  document.getElementById("btnLogin")?.addEventListener("click", login);
}

initDefaults();
wire();
setOutput("就绪：先启动后端(8080)与 nginx(80)，然后点登录/注册。");

