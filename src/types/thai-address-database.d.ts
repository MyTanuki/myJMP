declare module "thai-address-database" {
  export interface ThaiAddress {
    district: string; // ตำบล/แขวง
    amphoe: string; // อำเภอ/เขต
    province: string; // จังหวัด
    zipcode: string; // รหัสไปรษณีย์
  }
  export function searchAddressByDistrict(search: string): ThaiAddress[];
  export function searchAddressByAmphoe(search: string): ThaiAddress[];
  export function searchAddressByProvince(search: string): ThaiAddress[];
  export function searchAddressByZipcode(search: string | number): ThaiAddress[];
}
