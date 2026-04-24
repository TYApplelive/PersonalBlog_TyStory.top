/**
 * 联系方式配置数据
 */

import type { ContactItem, ContactKey } from "@stores/site";

export const contactsData: Record<ContactKey, ContactItem> = {
  github: {
    label: "GitHub",
    value: "TYApplelive",
    href: "https://github.com/TYApplelive",
  },
  qq: {
    label: "QQ",
    value: "2623999208",
  },
  wechat: {
    label: "微信",
    value: "applelive2003",
  },
};