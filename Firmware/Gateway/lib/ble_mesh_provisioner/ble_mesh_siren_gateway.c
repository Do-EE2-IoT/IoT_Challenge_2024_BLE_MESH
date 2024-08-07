#include <sdkconfig.h>

#include "esp_log.h"
// #include "nvs_flash.h"

#include "esp_bt.h"
#include "esp_ble_mesh_defs.h"
#include <inttypes.h>
#include <stdint.h>
#include "ble_mesh_provisioner_lib.h"
#include "nvs_flash.h"
#include "MQTT_lib.h"

#define TAG "SIREN CLIENT:: "

/*******************************************
 ****** Private Variables Definitions ******
 *******************************************/

//nvs_handle_t my_handle;

static uint8_t dev_uuid[16] = {0xdd, 0xdd};              /**< Device UUID */
static uint16_t node_net_idx = ESP_BLE_MESH_KEY_UNUSED;  /**< Stores Netkey Index after provisioning */
static uint16_t node_app_idx = ESP_BLE_MESH_NET_PRIMARY; /**< Stores Appkey Index bound to the Custom Model by the provisioner, defaults to 0x000 primary key */

//* Definicao do Configuration Server Model
static esp_ble_mesh_cfg_srv_t config_server = {
    .relay = ESP_BLE_MESH_RELAY_ENABLED,
    .beacon = ESP_BLE_MESH_BEACON_ENABLED,
#if defined(CONFIG_BLE_MESH_FRIEND)
    .friend_state = ESP_BLE_MESH_FRIEND_ENABLED,
#else
    .friend_state = ESP_BLE_MESH_FRIEND_NOT_SUPPORTED,
#endif
#if defined(CONFIG_BLE_MESH_GATT_PROXY_SERVER)
    .gatt_proxy = ESP_BLE_MESH_GATT_PROXY_ENABLED,
#else
    .gatt_proxy = ESP_BLE_MESH_GATT_PROXY_NOT_SUPPORTED,
#endif
    .default_ttl = 7,
    /* 3 transmissions with 20ms interval */
    .net_transmit = ESP_BLE_MESH_TRANSMIT(2, 20),
    .relay_retransmit = ESP_BLE_MESH_TRANSMIT(2, 20),
};
extern esp_ble_mesh_client_t custom_siren_client;

/**
 * @brief Parses received Sensor Model raw data and stores it on appropriate structure
 *
 * @param  recv_param   Pointer to model callback received parameter
 * @param  parsed_data  Pointer to where the parsed data will be stored
 */
static void parse_received_data(esp_ble_mesh_model_cb_param_t *recv_param, model_siren_data_t *parsed_data);

static void ble_mesh_custom_siren_client_model_cb(esp_ble_mesh_model_cb_event_t event,
                                                  esp_ble_mesh_model_cb_param_t *param)
{
    switch (event)
    {
    case ESP_BLE_MESH_MODEL_OPERATION_EVT:
        switch (param->model_operation.opcode)
        {
        case ESP_BLE_MESH_CUSTOM_SENSOR_MODEL_OP_STATUS:
            ESP_LOGI(TAG, "OP_STATUS -- Message opcode receive: 0x%06" PRIx32, param->model_operation.opcode);
            ESP_LOG_BUFFER_HEX(TAG, param->model_operation.msg, param->model_operation.length);
            // ESP_LOGI(TAG, "\t Message 0x", param->model_operation.msg);
            break;

        default:
            ESP_LOGW(TAG, "Received unrecognized OPCODE message");
            break;
        }
        break;

    case ESP_BLE_MESH_MODEL_SEND_COMP_EVT:
        if (param->model_send_comp.err_code)
        {
            ESP_LOGE(TAG, "Failed to send message 0x%06" PRIx32, param->model_send_comp.opcode);
            break;
        }
        ESP_LOGI(TAG, "Cannot send opcode 0x%06" PRIx32, param->model_send_comp.opcode);

        break;

    case ESP_BLE_MESH_CLIENT_MODEL_RECV_PUBLISH_MSG_EVT:
        switch (param->client_recv_publish_msg.opcode)
        {
        case ESP_BLE_MESH_CUSTOM_SIREN_MODEL_OP_STATUS:
            ESP_LOGI(TAG, " Publish OP_STATUS -- opcode message: 0x%06" PRIx32, param->client_recv_publish_msg.opcode);
            ESP_LOG_BUFFER_HEX(TAG, param->client_recv_publish_msg.msg, param->client_recv_publish_msg.length);
            //! Fazer alguma coisa nesse get ao inves de só printar o valor
            model_siren_data_t received_data;
            parse_received_data(param, &received_data);
            char data[200];
            // Open
            esp_err_t err = nvs_open("storage", NVS_READONLY, &my_handle);
            if (err != ESP_OK)
            {
                printf("Error (%s) opening NVS handle!\n", esp_err_to_name(err));
            }
            else
            {
                printf("Done\n");
            }
            // Read
            char output[30];
            size_t size = sizeof(output);
            err = nvs_get_str(my_handle, "clientID", output, &size);
            //ESP_LOGI(TAG, "READ CLIENT ID");
            // close
            printf("Done\n");
            nvs_close(my_handle);
            printf("Done\n");
            sprintf(data, "{\"type\":\"siren\",\"clientID\":\"%s\",\"control\":%d,\"address\":\"0x%04x\"}",
                    output, received_data.siren_onoff , param->client_recv_publish_msg.ctx->addr);
            //free(control_siren);
            mqtt_client_publish("/device/sirenres", 1, data);
            printf("Done\n");
            break;

        default:
            ESP_LOGW(TAG, "Received unrecognized OPCODE message: 0x%08" PRIx32, param->client_recv_publish_msg.opcode);
            break;
        }
        break;

    case ESP_BLE_MESH_CLIENT_MODEL_SEND_TIMEOUT_EVT:
        ESP_LOGW(TAG, "Timeout send message opcode 0x%06" PRIx32, param->client_send_timeout.opcode);
        break;

    default:
        ESP_LOGW(TAG, "%s - Unrecognized event: 0x%04x", __func__, event);
        break;
    }
}

static void parse_received_data(esp_ble_mesh_model_cb_param_t *recv_param, model_siren_data_t *parsed_data)
{
    if (recv_param->client_recv_publish_msg.length < sizeof(parsed_data))
    {
        ESP_LOGE(TAG, "Invalid received message lenght: %d", recv_param->client_recv_publish_msg.length);
        return;
    }

    parsed_data = (model_siren_data_t *)recv_param->client_recv_publish_msg.msg;

    ESP_LOGW("PARSED_DATA", "temperature  = %f", parsed_data->temperature);
    ESP_LOGW("PARSED_DATA", "humidity= %f", parsed_data->humidity);
    ESP_LOGW("PARSED_DATA", "xxx= %f", parsed_data->xxx);
    ESP_LOGW("PARSED_DATA", "siren_onoff= %d", parsed_data->siren_onoff);
}

/*******************************************
 ****** Public Functions Definitions ******
 *******************************************/
void register_for_siren_client_custom_model(void)
{
    esp_err_t err = ESP_OK;

    // ngat van chuyen ban tin
    esp_ble_mesh_register_custom_model_callback(ble_mesh_custom_siren_client_model_cb);
}
void gateway_send_data_to_Siren(float temperature, float humidity, float xxx, int siren_onoff)
{
    esp_ble_mesh_msg_ctx_t ctx = {0};
    uint32_t opcode;
    esp_err_t err;
    model_siren_data_t set_data;
    set_data.temperature = temperature;
    set_data.humidity = humidity;
    set_data.xxx = xxx;
    set_data.siren_onoff = siren_onoff;
    opcode = ESP_BLE_MESH_CUSTOM_SENSOR_MODEL_OP_SET;

    ctx.net_idx = prov_key.net_idx;
    ctx.app_idx = prov_key.app_idx;
    // ctx.addr = ESP_BLE_MESH_ADDR_ALL_NODES;
    ctx.addr = 0x0004;  //sua from 0x0002

    ctx.send_ttl = 3;
    ctx.send_rel = true;

    ESP_ERROR_CHECK(esp_ble_mesh_client_model_send_msg(custom_siren_client.model, &ctx, opcode,
                                                       sizeof(set_data), (uint8_t *)&set_data, 1000, true, ROLE_PROVISIONER));

    // if (err != ESP_OK) {
    //     ESP_LOGE(TAG, "Cannot send set message ");
    // }
}