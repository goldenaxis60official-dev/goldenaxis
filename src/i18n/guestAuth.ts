// src/i18n/guestAuth.ts

export type GuestLanguage = "en" | "zh";

export const guestAuth = {
  en: {
    langButton: "中文",

    common: {
      terms: "Terms",
      support: "Support",
      secure: "Secure",
      restricted: "Restricted",
      footerMember: "© Golden Axis 60 · Official Member Portal",
      footerAdmin: "© Golden Axis 60 · Control Center",
    },

    login: {
      memberPortal: "Member Portal",
      controlCenter: "Control Center",
      officialAccess: "Official Member Access",
      controlAccess: "Authorized Control Access",
      titleMember: "Welcome Back",
      titleAdmin: "Admin Control Login",
      descMember:
        "Login to continue your assigned campaign tasks, account records, and support messages.",
      descAdmin:
        "Login to manage users, generated orders, wallet reviews, support messages, and platform controls.",
      emailLabel: "Email or Name",
      emailPlaceholder: "Email or display name",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      login: "Login",
      loggingIn: "Logging in...",
      newHere: "New here?",
      createAccount: "Create account",
      authorizedOnly: "Authorized personnel only",
      securityTitleMember: "Protected member access",
      securityTitleAdmin: "Restricted control access",
      securityDescMember:
        "Your member account, activity records, and support messages are protected through a secure login session.",
      securityDescAdmin:
        "This entrance is limited to authorized control accounts only. Normal member accounts should use the official member website.",

      errors: {
        missingFields: "Please enter your email or display name and password.",
        cannotVerify: "We could not verify those login details.",
        sessionNotFound: "Login succeeded, but user session was not found.",
        profileNotFound: "Profile not found.",
        controlOnly:
          "This control link is only for authorized control accounts. Please use the member website for normal access.",
        notActivated:
          "This account is not fully activated. Please register again with a valid referral code.",
        unknown: "Something went wrong.",
      },
    },

    register: {
  official: "Official",
  memberRegistration: "Member Registration",
  officialMemberRegistration: "Official Member Registration",
  title: "Create Account",
  description:
    "Create your Golden Axis 60 member account to access assigned campaign tasks, account records, referral benefits, and support.",

  displayName: "Display Name",
  displayNamePlaceholder: "Gold Member",
  email: "Email Address",
  emailPlaceholder: "name@example.com",
  password: "Password",
  passwordPlaceholder: "Minimum 6 characters",
  confirmPassword: "Confirm Password",
  confirmPasswordPlaceholder: "Enter password again",
  withdrawPasscode: "Withdraw Passcode",
  withdrawPasscodePlaceholder: "Create 6-digit passcode",
  confirmWithdrawPasscode: "Confirm Withdraw Passcode",
  confirmWithdrawPasscodePlaceholder: "Enter passcode again",
  referralCode: "Referral Code",
  required: "Required",
  referralPlaceholder: "Enter referral code",

  agreement:
    "I agree to the Golden Axis 60 member agreement, campaign rules, and account review process.",

  creating: "Creating account...",
  create: "Create Account",

  setupTitle: "Member account setup",
  setupDescription:
    "Your account is created securely and may be reviewed for normal platform protection.",
  referralRequired:
    "A valid referral code is required to create a member account.",

  alreadyHave: "Already have an account?",
  login: "Login",

  errors: {
    acceptAgreement: "Please accept the member agreement first.",
    displayNameRequired: "Display name is required.",
    emailPasswordRequired: "Email and password are required.",
    passwordLength: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    passcodeFormat: "Withdraw passcode must be exactly 6 digits.",
    passcodeMismatch: "Withdraw passcodes do not match.",
    referralRequired: "Valid referral code is required.",
    invalidReferral: "Invalid referral code. Please check your code and try again.",
    sessionNotFound: "Account created, but user session was not found.",
    emailConfirmEnabled:
      "Email confirmation is still enabled in Supabase. Turn off email confirmation first.",
    unknown: "Something went wrong.",
  },
}
  },

  zh: {
    langButton: "EN",

    common: {
      terms: "条款",
      support: "客服",
      secure: "安全",
      restricted: "限制访问",
      footerMember: "© Golden Axis 60 · 官方会员入口",
      footerAdmin: "© Golden Axis 60 · 控制中心",
    },

    login: {
      memberPortal: "会员入口",
      controlCenter: "控制中心",
      officialAccess: "官方会员访问",
      controlAccess: "授权控制访问",
      titleMember: "欢迎回来",
      titleAdmin: "控制中心登录",
      descMember: "登录后继续查看您的推广任务、账户记录和客服消息。",
      descAdmin: "登录以管理用户、订单、钱包审核、客服消息和平台控制。",
      emailLabel: "邮箱或名称",
      emailPlaceholder: "邮箱或显示名称",
      passwordLabel: "密码",
      passwordPlaceholder: "请输入密码",
      login: "登录",
      loggingIn: "正在登录...",
      newHere: "新用户？",
      createAccount: "创建账户",
      authorizedOnly: "仅限授权人员",
      securityTitleMember: "会员安全访问",
      securityTitleAdmin: "限制控制访问",
      securityDescMember: "您的会员账户、活动记录和客服消息将通过安全登录保护。",
      securityDescAdmin: "此入口仅限授权控制账户使用。普通会员请使用官方会员网站。",

      errors: {
        missingFields: "请输入邮箱或显示名称和密码。",
        cannotVerify: "无法验证这些登录信息。",
        sessionNotFound: "登录成功，但未找到用户会话。",
        profileNotFound: "未找到账户资料。",
        controlOnly: "此控制链接仅限授权控制账户使用。普通会员请使用会员网站。",
        notActivated: "此账户尚未完全激活。请使用有效推荐码重新注册。",
        unknown: "出现错误，请稍后再试。",
      },
    },

    register: {
  official: "官方",
  memberRegistration: "会员注册",
  officialMemberRegistration: "官方会员注册",
  title: "创建账户",
  description:
    "创建您的 Golden Axis 60 会员账户，以访问推广任务、账户记录、推荐权益和客服。",

  displayName: "显示名称",
  displayNamePlaceholder: "黄金会员",
  email: "邮箱地址",
  emailPlaceholder: "name@example.com",
  password: "密码",
  passwordPlaceholder: "至少 6 个字符",
  confirmPassword: "确认密码",
  confirmPasswordPlaceholder: "再次输入密码",
  withdrawPasscode: "提现密码",
  withdrawPasscodePlaceholder: "创建 6 位数字密码",
  confirmWithdrawPasscode: "确认提现密码",
  confirmWithdrawPasscodePlaceholder: "再次输入提现密码",
  referralCode: "推荐码",
  required: "必填",
  referralPlaceholder: "输入推荐码",

  agreement:
    "我同意 Golden Axis 60 会员协议、推广规则和账户审核流程。",

  creating: "正在创建账户...",
  create: "创建账户",

  setupTitle: "会员账户设置",
  setupDescription:
    "您的账户将安全创建，并可能经过正常平台保护审核。",
  referralRequired: "创建会员账户需要有效推荐码。",

  alreadyHave: "已有账户？",
  login: "登录",

  errors: {
    acceptAgreement: "请先同意会员协议。",
    displayNameRequired: "请输入显示名称。",
    emailPasswordRequired: "请输入邮箱和密码。",
    passwordLength: "密码至少需要 6 个字符。",
    passwordMismatch: "两次输入的密码不一致。",
    passcodeFormat: "提现密码必须是 6 位数字。",
    passcodeMismatch: "两次输入的提现密码不一致。",
    referralRequired: "请输入有效推荐码。",
    invalidReferral: "推荐码无效，请检查后重试。",
    sessionNotFound: "账户已创建，但未找到用户会话。",
    emailConfirmEnabled:
      "Supabase 邮箱确认仍然开启。请先关闭邮箱确认。",
    unknown: "出现错误，请稍后再试。",
  },
}
  },
};