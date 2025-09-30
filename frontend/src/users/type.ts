export type TUserRole = "admin" | "editor" | "user";

export type TUser = {
    id: string;
    name: string;
    username: string;
    role: TUserRole;
    email: string;
    phone: string;
    img: string;
};
