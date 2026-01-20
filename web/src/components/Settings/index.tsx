import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { githubService } from '../../services/github';
import styles from './index.module.scss';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const config = githubService.getConfig();
    if (config) {
      setToken(config.token);
      setOwner(config.owner);
      setRepo(config.repo);
    }
  }, []);

  const handleTest = async () => {
    if (!token || !owner || !repo) {
      setErrorMessage('请填写所有字段');
      setTestStatus('error');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setErrorMessage('');

    // 临时保存配置以进行测试
    const tempConfig = { token, owner, repo };
    githubService.saveConfig(tempConfig);

    try {
      const success = await githubService.testConnection();
      if (success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setErrorMessage('连接失败。请检查 Token 和仓库信息是否正确。');
      }
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '连接测试失败');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!token || !owner || !repo) {
      setErrorMessage('请填写所有字段');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      githubService.saveConfig({ token, owner, repo });

      // 测试连接
      const success = await githubService.testConnection();
      if (success) {
        setTestStatus('success');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage('配置已保存，但连接测试失败。请检查配置是否正确。');
        setTestStatus('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存失败');
      setTestStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={24} />
        </button>

        <h2 className={styles.title}>GitHub 配置</h2>

        <div className={styles.form}>
          <div>
            <label className={styles.label}>
              GitHub Token
            </label>
            <input
              type="password"
              className={styles.inputPrimary}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className={styles.helpText}>
              需要 <code>repo</code> 权限。
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                创建 Token
              </a>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              仓库所有者（用户名或组织名）
            </label>
            <input
              type="text"
              className={styles.inputPrimary}
              placeholder="your-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className={styles.label}>
              仓库名称
            </label>
            <input
              type="text"
              className={styles.inputPrimary}
              placeholder="game-queue"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {errorMessage && (
            <div className={styles.errorBox}>
              {errorMessage}
            </div>
          )}

          {testStatus === 'success' && (
            <div className={styles.successBox}>
              <CheckCircle size={18} />
              连接成功！
            </div>
          )}

          <div className={styles.actions}>
            <button
              onClick={handleTest}
              disabled={isTesting || !token || !owner || !repo}
              className={styles.btnTest}
            >
              {isTesting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  测试中...
                </>
              ) : testStatus === 'error' ? (
                <>
                  <XCircle size={18} />
                  重新测试
                </>
              ) : (
                '测试连接'
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !token || !owner || !repo}
              className={styles.btnSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={18} />
                  保存
                </>
              )}
            </button>
          </div>

          <div className={styles.instructions}>
            <strong>使用说明：</strong>
            <ul>
              <li>创建一个 GitHub Personal Access Token（需要 <code>repo</code> 权限）</li>
              <li>填写您的 GitHub 用户名和仓库名称</li>
              <li>点击"测试连接"验证配置是否正确</li>
              <li>配置保存在浏览器本地，不会上传到服务器</li>
              <li>所有游戏数据将保存到 GitHub 仓库的 <code>games.json</code> 文件</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
