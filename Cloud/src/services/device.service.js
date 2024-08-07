import ErrorResponse from "../helpers/errorHandle.response.js";
import newDeviceModel from "../models/new.model.js";
import RGBModel from "../models/rgb.model.js";
import SensorModel from "../models/sensor.model.js";
import SirenModel from "../models/siren.model.js";
import EncoderModel from "../models/encoder.model.js";
import DoorModel from "../models/door.model.js";
import userModel from "../models/user.model.js";
import publishTopic from "../mqtt/publish.mqtt/index.js";
import { subscribeTopic } from "../mqtt/subscribe.mqtt/index.js";
import baseResponse from "../helpers/respond.js";
import ButtonModel from "../models/button.model.js";

class DeviceService {
  addMyGateway = async (Gateway) => {
    const gateway = await userModel.findOne({ gateway: Gateway.macGateway });
    if (gateway) {
      return baseResponse(
        null,
        404,
        "You can't add this gateway because someone register it first! "
      );
    }
    // Khi bắn bất cứ thứ gì về cho gateway, / cuối luôn là địa chỉ mac
    publishTopic(
      `/device/addgateway/${Gateway.macGateway}`,
      1,
      JSON.stringify({
        mac: Gateway.macGateway,
        clientID: Gateway.clientID,
      })
    );

    return baseResponse(
      null,
      200,
      "You are successfully send request add gateway"
    );
  };

  myGateWay = async (clientID) => {
    const user = await userModel.findById(clientID);
    if (!user) {
      return baseResponse(null, 404, "User exit");
    }
    const data = {
      name: user.name,
      ID: user.gateway,
    };
    return baseResponse(data,200,null);
  };

  refreshNewDevice = async (clientID) => {
    const user = await userModel.findById(clientID);

    if (!user) {
      return baseResponse(null, 404, "User exit");
    }
    const payload = {
      message: "refresh",
    };

    publishTopic(`/device/refresh/${user.gateway}`, 1, JSON.stringify(payload));
    const newDevice = await newDeviceModel.findOne({ user: clientID });
    return baseResponse(newDevice, 200, "Refresh ....");
  };
  getDetectedDevice = async (id) => {
    const detectedDevice = await newDeviceModel.find({ user: id });
    return baseResponse(
      detectedDevice,
      200,
      "get detected devices successfully"
    );
  };

  addNewDevice = async (Infor) => {
    const User = await userModel.findById(Infor.clientID);
    if (!User) {
      return baseResponse(null, 404, "User exit");
    }
    publishTopic(
      `/device/addnewdevice/${User.gateway}`,
      1,
      JSON.stringify({
        uuid: Infor.uuid,
        mac: Infor.mac,
      })
    );
    const data = Infor.type;
    return baseResponse(data, 200, "Send request add device successfully");
  };

  deleteDevice = async (Infor) => {
    const User = await userModel.findById(Infor.clientID);
    if (!User) {
      return baseResponse(null, 404, "User exit");
    }
    if (Infor.type === "button") {
      const button = await ButtonModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!button) {
        return baseResponse(null, 404, "You aren't own this button");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: button.address,
        })
      );
    } else if (Infor.type === "rgb") {
      const rgb = await RGBModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!rgb) {
        return baseResponse(null, 404, "You aren't own this rgb");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: rgb.address,
        })
      );
    } else if (Infor.type === "encoder") {
      const encoder = await Encoder.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!encoder) {
        return baseResponse(null, 404, "You aren't own this encoder");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: encoder.address,
        })
      );
    } else if (Infor.type === "siren") {
      const siren = await SirenModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!siren) {
        return baseResponse(null, 404, "You aren't own this Siren");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: siren.address,
        })
      );
    } else if (Infor.type === "sensor") {
      const sensor = await SensorModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!sensor) {
        return baseResponse(null, 404, "You aren't own this sensor");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: sensor.address,
        })
      );
    } else if (Infor.type === "door") {
      const door = await EncoderModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!door) {
        return baseResponse(null, 404, "You aren't own this encoder");
      }

      publishTopic(
        `/device/deletedevice/${User.gateway}`,
        1,
        JSON.stringify({
          type: Infor.type,
          address: door.address,
        })
      );
    }

    return baseResponse(
      null,
      200,
      "Send request delete successfully, wait for respond"
    );
  };

  registerRoom = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 404, "User exit");
    }
    if (Infor.type === "button") {
      const button = await ButtonModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!button) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (button.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );

        await ButtonModel.findOneAndUpdate()
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "encoder") {
      const encoder = await EncoderModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!encoder) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (encoder.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "rgb") {
      const rgb = await RGBModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!rgb) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (rgb.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "siren") {
      const siren = await SirenModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!siren) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (siren.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "sensor") {
      const sensor = await SensorModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!sensor) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (sensor.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "door") {
      const door = await DoorModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!door) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room 1 is not  accepted`
        );
      }
      if (door.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/register/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    }
  };

  deleteRoom = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 404, "User exit");
    }
    if (Infor.type === "button") {
      const button = await ButtonModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!button) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room 1 is not  accepted`
        );
      }
      if (!button.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} not register this room yet!`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: "0xC000",
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to delete device ${Infor.type} have address ${Infor.address} to room successfully, wait for respond`
        );
      }
    } else if (Infor.type === "encoder") {
      const encoder = await EncoderModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!encoder) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room is not  accepted`
        );
      }
      if (!encoder.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} not register this room yet`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to register device ${Infor.type} have address ${Infor.address} to room successfully, wait for respond`
        );
      }
    } else if (Infor.type === "rgb") {
      const rgb = await RGBModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!rgb) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room is not  accepted`
        );
      }
      if (!rgb.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} not register this room yet`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to delete device ${Infor.type} have address ${Infor.address} to room successfully, wait for respond`
        );
      }
    } else if (Infor.type === "siren") {
      const siren = await SirenModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!siren) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room is not  accepted`
        );
      }
      if (!siren.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} not register this room yet`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to delete device ${Infor.type} have address ${Infor.address} to room 1 successfully, wait for respond`
        );
      }
    } else if (Infor.type === "sensor") {
      const sensor = await SensorModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!sensor) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, delete for room is not  accepted`
        );
      }
      if (!sensor.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} not register this room yet`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to delete device ${Infor.type} have address ${Infor.address} to room successfully, wait for respond`
        );
      }
    } else if (Infor.type === "door") {
      const door = await DoorModel.findOne({
        user: Infor.clientID,
        address: Infor.address,
      });
      if (!door) {
        return baseResponse(
          null,
          404,
          `You dont have this ${Infor.type}, register for room 1 is not  accepted`
        );
      }
      if (!door.Group.includes(Infor.group)) {
        return baseResponse(
          null,
          404,
          `This ${Infor.type} stay in room 1 before, can't add again`
        );
      } else {
        publishTopic(
          `/device/delete/room/${user.gateway}`,
          1,
          JSON.stringify({
            type: Infor.type,
            address: Infor.address,
            group: Infor.group,
          })
        );
        return baseResponse(
          null,
          201,
          `Send command to delete device ${Infor.type} have address ${Infor.address} to room successfully, wait for respond`
        );
      }
    }
  };

  rgbInfor = async (Infor) => {
    const rgb = await RGBModel.findOne({
      user: Infor.clientID,
      address: Infor.RGBAddress,
    });
    console.log(Infor.RGBAddress);

    if (!rgb) {
      return baseResponse(null, 404, "This RGB is not belong to you");
    }

    return baseResponse(
      rgb,
      200,
      `get rgb with ID ${rgb.address} successfully`
    );
  };

  sensorInfor = async (Infor) => {
    const sensor = await SensorModel.findOne({
      user: Infor.clientID,
      address: Infor.SensorAddress,
    });
    console.log(Infor.SensorAddress);

    if (!sensor) {
      return baseResponse(null, 404, "This Sensor is not belong to you");
    }

    return baseResponse(
      sensor,
      200,
      `get sensor with ID ${sensor.address} successfully`
    );
  };

  sirenInfor = async (Infor) => {
    const siren = await SirenModel.findOne({
      user: Infor.clientID,
      address: Infor.SirenAddress,
    });
    console.log(Infor.SirenAddress);

    if (!siren) {
      return baseResponse(null, 404, "This Siren is not belong to you");
    }

    return baseResponse(
      siren,
      200,
      `get sensor with ID ${siren.address} successfully`
    );
  };

  encoderInfor = async (Infor) => {
    const encoder = await EncoderModel.findOne({
      user: Infor.clientID,
      address: Infor.EncoderAddress,
    });
    console.log(Infor.EncoderAddress);

    if (!encoder) {
      return baseResponse(null, 404, "This Encoder is not belong to you ");
    }

    return baseResponse(
      encoder,
      200,
      `get encoder with ID ${encoder.address} successfully`
    );
  };

  doorInfor = async (Infor) => {
    const door = await DoorModel.findOne({
      user: Infor.clientID,
      address: Infor.DoorAddress,
    });
    console.log(Infor.DoorAddress);

    if (!door) {
      return baseResponse(null, 404, "This Door is not belong to you");
    }

    return baseResponse(
      door,
      200,
      `get door with ID ${door.address} successfully`
    );
  };

  buttonInfor = async (Infor) => {
    const button = await ButtonModel.findOne({
      user: Infor.clientID,
      address: Infor.ButtonAddress,
    });
    console.log(Infor.ButtonAddress);

    if (!button) {
      return baseResponse(null, 404, "This Button is not belong to you");
    }

    return baseResponse(
      button,
      200,
      `get button with ID ${button.address} successfully`
    );
  };

  rgbControl = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 403, "User exit");
    }
    if (Infor.groupAddress) {
      console.log(Infor.groupAddress);
      const rgb = await RGBModel.findOne({
        user: Infor.clientID,
        Group: { $in: Infor.groupAddress },
      });

      if (!rgb) {
        return baseResponse(null, 404, "This RGB not belong to you");
      }
      const payload = {
        address: Infor.groupAddress,
        red: Infor.red,
        blue: Infor.blue,
        green: Infor.green,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    } else {
      const rgb = await RGBModel.findOne({
        user: Infor.clientID,
        address: Infor.unicastAddress,
      });
      console.log(Infor.unicastAddress);

      if (!rgb) {
        return baseResponse(null, 404, "This RGB not belong to you");
      }
      const payload = {
        type: "rgb",
        address: Infor.unicastAddress,
        red: Infor.red,
        blue: Infor.blue,
        green: Infor.green,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    }
    return baseResponse(
      null,
      200,
      "Send RGB control successfully, wait for respond"
    );
  };

  buttonControl = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 403, "User exit");
    }
    if (Infor.groupAddress) {
      console.log(Infor.groupAddress);
      const button = await ButtonModel.findOne({
        user: Infor.clientID,
        Group: { $in: Infor.groupAddress },
      });

      if (!button) {
        return baseResponse(null, 404, "This button not belong to you");
      }

      const payload = {
        type: "button",
        address: "0xC000",
        control: Infor.control.control,
      };
      console.log(payload);
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    } else {
      const button = await ButtonModel.findOne({
        user: Infor.clientID,
        address: Infor.unicastAddress,
      });
      console.log(Infor.unicastAddress);

      if (!button) {
        return baseResponse(null, 404, "This button not belong to you");
      }
      const payload = {
        type: "button",
        address: Infor.unicastAddress,
        control: Infor.control.control,
      };
      console.log(payload);
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    }
    return baseResponse(
      null,
      200,
      "Send Button control successfully, wait for respond"
    );
  };
  sirenControl = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 403, "User exit");
    }
    if (Infor.groupAddress) {
      console.log(Infor.groupAddress);
      const siren = await SirenModel.findOne({
        user: Infor.clientID,
        Group: { $in: Infor.groupAddress },
      });

      if (!siren) {
        return baseResponse(null, 404, "This button not belong to you");
      }
      const payload = {
        type: "siren",
        address: Infor.groupAddress,
        control: Infor.control,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    } else {
      const siren = await sirenModel.findOne({
        user: Infor.clientID,
        address: Infor.unicastAddress,
      });
      console.log(Infor.unicastAddress);

      if (!siren) {
        return baseResponse(null, 404, "This button not belong to you");
      }
      const payload = {
        type: "siren",
        address: Infor.unicastAddress,
        control: Infor.control,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    }
    return baseResponse(
      null,
      200,
      "Send siren control successfully, wait for respond"
    );
  };

  doorControl = async (Infor) => {
    const user = await userModel.findById(Infor.clientID);
    if (!user) {
      return baseResponse(null, 403, "User exit");
    }
    if (Infor.groupAddress) {
      console.log(Infor.groupAddress);
      const door = await DoorModel.findOne({
        user: Infor.clientID,
        Group: { $in: Infor.groupAddress },
      });

      if (!door) {
        return baseResponse(null, 404, "This door not belong to you");
      }
      const payload = {
        type: "door",
        address: Infor.groupAddress,
        control: Infor.control,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    } else {
      const door = await DoorModel.findOne({
        user: Infor.clientID,
        address: Infor.unicastAddress,
      });
      console.log(Infor.unicastAddress);

      if (!door) {
        return baseResponse(null, 404, "This door not belong to you");
      }
      const payload = {
        type: "door",
        address: Infor.unicastAddress,
        control: Infor.control,
      };
      publishTopic(
        `/device/control/${user.gateway}`,
        1,
        JSON.stringify(payload)
      );
    }
    return baseResponse(
      null,
      200,
      "Send door control successfully, wait for respond"
    );
  };
}

export default new DeviceService();
