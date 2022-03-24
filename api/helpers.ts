// @ts-ignore
import omitDeep from 'omit-deep';

export const rig0x = (message: string, obj: object) => {
  console.log(message)
  var result = JSON.stringify(obj)
  console.log(result)
  // console.log(message, JSON.stringify(obj, null, 2));
};

export const prettyJSON = (message: string, obj: string) => {
  console.log(message, JSON.stringify(obj, null, 2));
};

export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const omit = (object: any, name: string) => {
  return omitDeep(object, name);
};
