const { z } = require('zod');

// ========== 常量 ==========
const VALID_TAGS = ['学习', '工作', '社交', '健康', '创意', '理财', '生活'];

// ========== 通用 ==========
function isValidDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误 (YYYY-MM-DD)')
  .refine(isValidDateString, '日期不存在');
const yearMonthSchema = z.string()
  .regex(/^\d{4}-\d{2}$/, '年月格式错误 (YYYY-MM)')
  .refine(value => {
    const [, month] = value.split('-').map(Number);
    return month >= 1 && month <= 12;
  }, '月份不存在');
const tagSchema = z.enum(VALID_TAGS, { errorMap: () => ({ message: `标签必须是: ${VALID_TAGS.join(', ')}` }) });

// ========== Auth ==========
const registerSchema = z.object({
  username: z.string().trim().min(2, '用户名至少2字符').max(50, '用户名最多50字符')
    .regex(/^[a-zA-Z0-9_一-鿿]+$/, '用户名只能包含字母、数字、下划线或中文'),
  password: z.string().min(8, '密码至少8个字符').max(128, '密码最多128字符'),
  displayName: z.string().trim().max(100, '昵称最多100字符').optional(),
  turnstileToken: z.string().min(1, '请完成人机验证').max(4096, '人机验证已失效，请重试'),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

const VALID_THEMES = ['default', 'boy', 'girl', 'princess', 'anime'];

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, '昵称不能为空').max(100, '昵称最多100字符').optional(),
  theme: z.enum(VALID_THEMES, { errorMap: () => ({ message: `主题必须是: ${VALID_THEMES.join(', ')}` }) }).optional(),
}).refine(d => d.displayName !== undefined || d.theme !== undefined, { message: '无更新内容' });

const achievementCodeSchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/, '徽章 code 格式错误');
const achievementsBatchSchema = z.object({
  codes: z.array(achievementCodeSchema).min(1, '至少传一个 code').max(40, '一次最多40个'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(8, '新密码至少8个字符').max(128, '新密码最多128字符'),
});

// ========== Entries ==========
const entryItemSchema = z.object({
  text: z.string().trim().min(1, '内容不能为空').max(500, '单条内容最多500字符'),
  tag: tagSchema,
});

const saveEntriesSchema = z.object({
  entries: z.array(entryItemSchema).min(1, '至少填写一条').max(20, '每天最多20条'),
});

// ========== Dreams ==========
const createDreamSchema = z.object({
  name: z.string().trim().min(1, '梦想名称不能为空').max(200, '名称最多200字符'),
  cost: z.number().min(0, '费用不能为负').max(99999999, '费用过大').default(0),
});

const updateDreamSchema = z.object({
  done: z.boolean().optional(),
  saved: z.number().min(0, '金额不能为负').max(99999999, '金额过大').optional(),
}).refine(d => d.done !== undefined || d.saved !== undefined, { message: '无更新内容' });

// ========== Savings ==========
const savingsSchema = z.object({
  type: z.enum(['deposit', 'withdraw'], { errorMap: () => ({ message: '类型必须是 deposit 或 withdraw' }) }),
  amount: z.number().positive('金额必须大于0').max(99999999, '金额过大'),
  note: z.string().max(200, '备注最多200字符').default(''),
});

// ========== Shares ==========
const createShareSchema = z.object({
  entryDate: dateSchema,
});

// ========== 中间件工厂 ==========
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: msg });
    }
    req.validated = result.data;
    next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    // Validate specific param keys
    for (const [key, s] of Object.entries(schema)) {
      const result = s.safeParse(req.params[key]);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }
    }
    next();
  };
}

module.exports = {
  VALID_TAGS,
  VALID_THEMES,
  dateSchema,
  yearMonthSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  saveEntriesSchema,
  createDreamSchema,
  updateDreamSchema,
  savingsSchema,
  createShareSchema,
  achievementsBatchSchema,
  validate,
  validateParams,
};
